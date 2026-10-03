import { Effect, Exit } from "effect";
import {
  AdvectSettings,
  AsyncFunction,
  createAdvectContext,
} from "./advect.lib";
import { isDirectiveAttribute, parseDirectives } from "./advect.directives";
import type { AdvectElement } from "./advect.element";

/** The evaluation context passed to every compiled expression and VM hook. */
export type AdvectContext = ReturnType<typeof createAdvectContext>;
/** A map of scoped variable names to their current values. */
type Locals = Record<string, any>;

/** Error raised when an interpolated/bound expression throws during evaluation. */
export class AdvectExpressionError extends Error {
  readonly _tag = "AdvectExpressionError";
  constructor(
    readonly source: string,
    readonly refId: string,
    readonly cause: unknown
  ) {
    super(`[advect] failed to evaluate "${source}"`);
  }
}

/** Error raised when an event handler throws. */
export class AdvectEventHandlerError extends Error {
  readonly _tag = "AdvectEventHandlerError";
  constructor(
    readonly source: string,
    readonly refId: string,
    readonly cause: unknown
  ) {
    super(`[advect] event handler "${source}" failed`);
  }
}

/** Error raised when a VM lifecycle hook throws. */
export class AdvectLifecycleError extends Error {
  readonly _tag = "AdvectLifecycleError";
  constructor(readonly hook: string, readonly cause: unknown) {
    super(`[advect] lifecycle hook "${hook}" failed`);
  }
}

/** Logs a failure through Effect, falling back to `console.error`. */
export function logEffectError(message: string, cause: unknown) {
  try {
    Effect.runSync(Effect.logError(message, cause));
  } catch {
    console.error(message, cause);
  }
}

/** Cache of compiled expression functions keyed by kind/params/keys/source. */
const fnCache = new Map<string, Function>();
/** Cache of generated locals-destructuring scripts keyed by the variable names. */
const localsCache = new Map<string, string>();
/** Cache of compiled event handlers and whether they are expressions. */
const eventCache = new Map<string, { fn: Function; expression: boolean }>();

/** Builds (and caches) the `var` preamble that unpacks locals from `$$$refData`. */
function localsScript(keys: string[]): string {
  const cacheKey = keys.join("\u0000");
  let script = localsCache.get(cacheKey);
  if (script === undefined) {
    script = keys
      .map((k) => `var ${k} = $$$refData[${JSON.stringify(k)}];`)
      .join("\n");
    localsCache.set(cacheKey, script);
  }
  return script;
}

/** Parameter list passed to compiled attribute/text/if expressions. */
const EXPR_PARAMS = ["$$$context", "$$$refData", "ref", "$state", "state", "$attr"];
/** Parameter list passed to compiled event handlers. */
const EVENT_PARAMS = [
  "$$$context",
  "$$$refData",
  "$event",
  "$this",
  "$state",
  "state",
  "$attr",
];

/** Compiles (and caches) a function from a generated body and parameter list. */
function compileExpr(
  kind: string,
  source: string,
  keys: string[],
  params: string[],
  body: string,
  async = false
): Function {
  const cacheKey =
    kind + "\u0000" + params.join(",") + "\u0000" + keys.join(",") + "\u0000" + source;
  let fn = fnCache.get(cacheKey);
  if (!fn) {
    fn = async ? new AsyncFunction(...params, body) : new Function(...params, body);
    fnCache.set(cacheKey, fn);
  }
  return fn;
}

/** Compiles an expression used as an attribute value. */
function compileAttr(expr: string, keys: string[]): Function {
  return compileExpr(
    "attr",
    expr,
    keys,
    EXPR_PARAMS,
    `${localsScript(keys)}; return (${expr});`
  );
}

/** Compiles an interpolation `{{ expr }}` into a value-producing function. */
function compileText(expr: string, keys: string[]): Function {
  return compileExpr(
    "text",
    expr,
    keys,
    EXPR_PARAMS,
    `${localsScript(keys)}; return (${expr});`
  );
}

/** Compiles a `v-if`/`v-show` condition into a boolean-producing function. */
function compileIf(expr: string, keys: string[]): Function {
  return compileExpr(
    "if",
    expr,
    keys,
    EXPR_PARAMS,
    `${localsScript(keys)}; return (${expr});`
  );
}

/** Compiles a `v-model` write target into a function that assigns `$$$value`. */
function compileSetter(target: string, keys: string[]): Function {
  return compileExpr(
    "set",
    target,
    keys,
    [...EXPR_PARAMS, "$$$value"],
    `${localsScript(keys)}\n${target} = $$$value;`
  );
}

/** Compiles an event handler, preferring expression form and falling back to statement form. */
function compileEvent(
  source: string,
  keys: string[]
): { fn: Function; expression: boolean } {
  const cacheKey = "event\u0000" + keys.join(",") + "\u0000" + source;
  const cached = eventCache.get(cacheKey);
  if (cached) return cached;
  const locals = localsScript(keys);
  let fn: Function;
  let expression = true;
  try {
    fn = new Function(...EVENT_PARAMS, `${locals}\nreturn (${source});`);
  } catch {
    fn = new Function(...EVENT_PARAMS, `${locals}\n${source}`);
    expression = false;
  }
  const result = { fn, expression };
  eventCache.set(cacheKey, result);
  return result;
}

/** Builds the positional argument list expected by compiled expressions. */
function evalArgs(
  context: AdvectContext,
  locals: Locals,
  ref: any,
  el: AdvectElement
): any[] {
  return [context, locals, ref, el.$state, el.state, el.$attr];
}

/** Runs a compiled function, logging and swallowing any thrown error. */
function safeEval(
  fn: Function,
  args: any[],
  source: string,
  refId: string
): any {
  const exit = Effect.runSyncExit(
    Effect.try({
      try: () => fn(...args),
      catch: (cause) => new AdvectExpressionError(source, refId, cause),
    })
  );
  if (Exit.isFailure(exit)) {
    logEffectError(`[advect] expression failed: ${source}`, exit.cause);
    return undefined;
  }
  return exit.value;
}

/** Invokes a VM lifecycle hook, awaiting it when it returns a promise. */
export function runHook(
  self: AdvectElement,
  hook: string,
  fn: ((...args: any[]) => any) | null | undefined
) {
  if (typeof fn !== "function") return;
  const exit = Effect.runSyncExit(
    Effect.try({
      try: () => fn.call(self),
      catch: (cause) => new AdvectLifecycleError(hook, cause),
    })
  );
  if (Exit.isFailure(exit)) {
    logEffectError(`[advect] lifecycle hook "${hook}" failed`, exit.cause);
    return;
  }
  const result: any = exit.value;
  if (result && typeof result.then === "function") {
    const eff = Effect.tryPromise({
      try: () => Promise.resolve(result),
      catch: (cause) => new AdvectLifecycleError(hook, cause),
    });
    void Effect.runPromise(
      Effect.catch(eff, (e: any) =>
        Effect.logError(`[advect] async lifecycle hook "${hook}" failed`, e)
      )
    );
  }
}

/** Flattens a string/array/object class binding into a class string. */
function normalizeClass(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(normalizeClass).filter(Boolean).join(" ");
  if (typeof value === "object") {
    return Object.keys(value)
      .filter((k) => (value as any)[k])
      .join(" ");
  }
  return String(value);
}

/** Converts a camelCase CSS property to kebab-case (leaving custom properties alone). */
function styleToKebab(name: string): string {
  if (name.startsWith("--")) return name;
  return name.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}

/** Flattens a style binding (string, array or object) into `[property, value]` pairs. */
function styleEntries(value: any): [string, string][] {
  if (!value) return [];
  if (typeof value === "string") {
    return value
      .split(";")
      .map((decl) => decl.split(":"))
      .filter((parts) => parts[0] && parts[0].trim())
      .map((parts) => [parts[0].trim(), (parts[1] ?? "").trim()] as [string, string]);
  }
  if (Array.isArray(value)) return value.flatMap(styleEntries);
  if (typeof value === "object") {
    return Object.entries(value)
      .filter(([, v]) => v != null)
      .map(([k, v]) => [k, String(v)] as [string, string]);
  }
  return [];
}

/** Matches a `{{ ... }}` interpolation token in text nodes. */
const TEXT_INTERP = /\{\{(.*?)\}\}/g;

/** A literal run of text between interpolations. */
interface SegmentText {
  text: string;
}
/** A compiled interpolation segment within a text node. */
interface SegmentExpr {
  source: string;
  fn: Function;
}
/** One piece of a text node, either literal or interpolated. */
type TextSegment = SegmentText | SegmentExpr;

/** A compiled attribute binding. */
interface AttrSpec {
  name: string;
  source: string;
  fn: Function;
  isBoolean: boolean;
}
/** A compiled event listener. */
interface EventSpec {
  name: string;
  source: string;
  fn: Function;
  expression: boolean;
  modifiers: string[];
}
/** A compiled expression together with its original source. */
interface ExprSpec {
  source: string;
  fn: Function;
}
/** A compiled `v-for` directive. */
interface ForSpec {
  names: string[];
  arraySource: string;
  arrayFn: Function;
  keySource?: string;
  keyFn?: Function;
}
/** A compiled `v-model` directive. */
interface ModelSpec {
  target: string;
  modifiers: string[];
  getter: Function;
  setter: Function;
}
/** Compile-time plan for an element node. */
interface PlanEl {
  kind: "el";
  template: Element;
  ref: string;
  ifSpec?: ExprSpec;
  forSpec?: ForSpec;
  attrs: AttrSpec[];
  events: EventSpec[];
  classSpec?: ExprSpec;
  styleSpec?: ExprSpec;
  bindObject?: ExprSpec;
  html?: ExprSpec;
  text?: ExprSpec;
  show?: ExprSpec;
  model?: ModelSpec;
  once: boolean;
  staticClass: string;
  staticStyle: string;
  children: PlanNode[];
}
/** Compile-time plan for a `<template>` fragment. */
interface PlanFragment {
  kind: "fragment";
  ifSpec?: ExprSpec;
  forSpec?: ForSpec;
  slot?: string;
  children: PlanNode[];
}
/** Compile-time plan for a text node containing interpolations. */
interface PlanTextNode {
  kind: "text";
  segments: TextSegment[];
}
/** Compile-time plan for a node passed through verbatim. */
interface PlanRawNode {
  kind: "raw";
  node: Node;
}
/** Any entry in the compiled render plan. */
type PlanNode = PlanEl | PlanFragment | PlanTextNode | PlanRawNode;

/** Runtime counterpart of `PlanTextNode`. */
interface RTText {
  kind: "text";
  plan: PlanTextNode;
  node: Text;
  locals: Locals;
}
/** Runtime counterpart of `PlanRawNode`. */
interface RTRaw {
  kind: "raw";
  plan: PlanRawNode;
  node: Node;
}
/** One rendered `v-for` iteration. */
interface RTItem {
  key: string;
  refId: string;
  locals: Locals;
  nodes: RTNode[];
}
/** Runtime counterpart of `PlanEl`, holding live DOM and per-node caches. */
interface RTEl {
  kind: "el";
  plan: PlanEl;
  el: Element | null;
  parent: Node;
  anchor?: Comment;
  locals: Locals;
  refId: string;
  children: RTNode[];
  items?: RTItem[];
  abort?: AbortController;
  eventsBound?: boolean;
  modelBound?: boolean;
  boundKeys?: Set<string>;
  styleKeys?: Set<string>;
  onceDone?: boolean;
  showOriginal?: string;
  lastHtml?: string;
}
/** Runtime counterpart of `PlanFragment`. */
interface RTFragment {
  kind: "fragment";
  plan: PlanFragment;
  parent: Node;
  anchor: Comment;
  locals: Locals;
  children: RTNode[];
  items?: RTItem[];
  onceDone?: boolean;
}
/** Any runtime render node. */
type RTNode = RTText | RTRaw | RTEl | RTFragment;

/** True when an attribute is a DOM boolean attribute. */
function isBooleanAttr(name: string): boolean {
  return AdvectSettings.attributes.booleans.some(
    (b) => b.toLocaleLowerCase() === name.toLocaleLowerCase()
  );
}

/** Strips all Advect directive attributes from a live element. */
function removeDirectives(el: Element) {
  for (const name of el.getAttributeNames()) {
    if (isDirectiveAttribute(name)) el.removeAttribute(name);
  }
}

/** Splits a text node's value into literal and compiled interpolation segments. */
function splitSegments(data: string, keys: string[]): TextSegment[] {
  const segments: TextSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TEXT_INTERP.lastIndex = 0;
  while ((m = TEXT_INTERP.exec(data))) {
    if (m.index > last) segments.push({ text: data.slice(last, m.index) });
    const source = m[1].trim();
    segments.push({ source, fn: compileText(source, keys) });
    last = m.index + m[0].length;
  }
  if (last < data.length) segments.push({ text: data.slice(last) });
  return segments;
}

/** Composes an `else-if`/`else` condition from the preceding conditions in the chain. */
function composeIf(previous: string[], expr?: string): string {
  const negated = previous.map((p) => `(${p})`).join(" || ");
  const base = negated ? `!(${negated})` : "true";
  return expr === undefined ? base : `${base} && (${expr})`;
}

/** Compiles a container's child nodes, resolving `v-if`/`v-else-if`/`v-else` chains. */
function compileChildren(container: Node, keys: string[]): PlanNode[] {
  const out: PlanNode[] = [];
  let chain: string[] = [];
  let inChain = false;

  for (const child of Array.from(container.childNodes)) {
    if (child.nodeType === 3 && (child.nodeValue ?? "").trim() === "") {
      out.push(compileNode(child, keys));
      continue;
    }
    if (child.nodeType === 8) {
      out.push(compileNode(child, keys));
      continue;
    }
    if (child.nodeType === 1) {
      const el = child as Element;
      const directives = parseDirectives(el);
      if (directives.if !== undefined) {
        chain = [directives.if];
        inChain = true;
        out.push(compileNode(child, keys, directives.if));
        continue;
      }
      if (inChain && directives.elseIf !== undefined) {
        chain.push(directives.elseIf);
        out.push(compileNode(child, keys, composeIf(chain.slice(0, -1), directives.elseIf)));
        continue;
      }
      if (inChain && directives.else) {
        const effective = composeIf(chain);
        inChain = false;
        chain = [];
        out.push(compileNode(child, keys, effective));
        continue;
      }
    }
    inChain = false;
    chain = [];
    out.push(compileNode(child, keys));
  }

  return out;
}

/** Compiles a single DOM node into its render plan. */
function compileNode(node: Node, keys: string[], effectiveIf?: string): PlanNode {
  if (node.nodeType === 3) {
    const data = node.nodeValue ?? "";
    if (data.includes("{{")) {
      return { kind: "text", segments: splitSegments(data, keys) };
    }
    return { kind: "raw", node };
  }
  if (node.nodeType === 1) {
    const elem = node as Element;
    if (!(typeof HTMLElement !== "undefined" && elem instanceof HTMLElement)) {
      return { kind: "raw", node };
    }
    const tag = elem.tagName;
    if (tag === "STYLE" || tag === "SCRIPT") {
      return { kind: "raw", node };
    }
    const directives = parseDirectives(elem);
    if (directives.pre) {
      const clone = elem.cloneNode(true) as Element;
      clone.removeAttribute("v-pre");
      return { kind: "raw", node: clone };
    }
    if (
      tag === "TEMPLATE" &&
      (directives.for ||
        directives.if !== undefined ||
        directives.elseIf !== undefined ||
        directives.else ||
        directives.slot)
    ) {
      return compileFragment(elem as HTMLTemplateElement, keys, effectiveIf);
    }
    return compileEl(elem, keys, effectiveIf);
  }
  return { kind: "raw", node };
}

/** Compiles a parsed `v-for` directive using the enclosing variable scope. */
function compileForSpec(
  directive: { names: string[]; source: string },
  parentKeys: string[],
  key: string | undefined
): ForSpec {
  const itemKeys = [...parentKeys, ...directive.names].filter(Boolean);
  const spec: ForSpec = {
    names: directive.names,
    arraySource: directive.source,
    arrayFn: compileAttr(directive.source, parentKeys),
  };
  if (key !== undefined) {
    spec.keySource = key;
    spec.keyFn = compileAttr(key, itemKeys);
  }
  return spec;
}

/** Compiles a `<template>` element carrying `v-if`/`v-for`/`v-slot` into a plan fragment. */
function compileFragment(
  template: HTMLTemplateElement,
  parentKeys: string[],
  effectiveIf?: string
): PlanFragment {
  const directives = parseDirectives(template);
  let itemKeys = parentKeys;
  let forSpec: ForSpec | undefined;
  if (directives.for) {
    forSpec = compileForSpec(directives.for, parentKeys, directives.key);
    itemKeys = [...parentKeys, ...directives.for.names].filter(Boolean);
  }
  const ifSource = effectiveIf ?? directives.if;
  const ifSpec = ifSource !== undefined
    ? { source: ifSource, fn: compileIf(ifSource, parentKeys) }
    : undefined;
  return {
    kind: "fragment",
    ifSpec,
    forSpec,
    slot: directives.slot?.name,
    children: compileChildren(template.content, itemKeys),
  };
}

/** Compiles an element and all of its directives into an element plan. */
function compileEl(el: Element, parentKeys: string[], effectiveIf?: string): PlanEl {
  const directives = parseDirectives(el);
  const ref = el.getAttribute("ref") ?? "";

  let forSpec: ForSpec | undefined;
  let itemKeys = parentKeys;
  if (directives.for) {
    forSpec = compileForSpec(directives.for, parentKeys, directives.key);
    itemKeys = [...parentKeys, ...directives.for.names].filter(Boolean);
  }

  const attrs: AttrSpec[] = [];
  let classSpec: ExprSpec | undefined;
  let styleSpec: ExprSpec | undefined;
  for (const binding of directives.bindings) {
    if (binding.arg === "class") {
      classSpec = { source: binding.source, fn: compileAttr(binding.source, itemKeys) };
      continue;
    }
    if (binding.arg === "style") {
      styleSpec = { source: binding.source, fn: compileAttr(binding.source, itemKeys) };
      continue;
    }
    attrs.push({
      name: binding.arg,
      source: binding.source,
      fn: compileAttr(binding.source, itemKeys),
      isBoolean: isBooleanAttr(binding.arg),
    });
  }

  const events: EventSpec[] = directives.events.map((event) => {
    const compiled = compileEvent(event.source, itemKeys);
    return {
      name: event.name,
      source: event.source,
      fn: compiled.fn,
      expression: compiled.expression,
      modifiers: event.modifiers,
    };
  });

  const ifSource = effectiveIf ?? directives.if;
  const ifSpec = ifSource !== undefined
    ? { source: ifSource, fn: compileIf(ifSource, parentKeys) }
    : undefined;

  const html = directives.html !== undefined
    ? { source: directives.html, fn: compileAttr(directives.html, itemKeys) }
    : undefined;
  const text = directives.text !== undefined
    ? { source: directives.text, fn: compileAttr(directives.text, itemKeys) }
    : undefined;
  const show = directives.show !== undefined
    ? { source: directives.show, fn: compileAttr(directives.show, itemKeys) }
    : undefined;

  const model = directives.model
    ? {
        target: directives.model.target,
        modifiers: directives.model.modifiers,
        getter: compileAttr(directives.model.target, itemKeys),
        setter: compileSetter(directives.model.target, itemKeys),
      }
    : undefined;

  const children =
    html || text ? [] : compileChildren(el, itemKeys);

  return {
    kind: "el",
    template: el,
    ref,
    ifSpec,
    forSpec,
    attrs,
    events,
    classSpec,
    styleSpec,
    bindObject: directives.bindObject !== undefined
      ? { source: directives.bindObject, fn: compileAttr(directives.bindObject, itemKeys) }
      : undefined,
    html,
    text,
    show,
    model,
    once: !!directives.once,
    staticClass: el.getAttribute("class") ?? "",
    staticStyle: el.getAttribute("style") ?? "",
    children,
  };
}

/** Collects the live DOM nodes backing a runtime node (including `v-for` items). */
function rtDomNodes(rt: RTNode): Node[] {
  if (rt.kind === "text") return [rt.node];
  if (rt.kind === "raw") return [rt.node];
  const out: Node[] = [];
  if (rt.kind === "el") {
    if (rt.el) return [rt.el];
  } else {
    for (const child of rt.children) out.push(...rtDomNodes(child));
  }
  for (const item of rt.items ?? []) {
    for (const node of item.nodes) out.push(...rtDomNodes(node));
  }
  return out;
}

/** Tags child DOM nodes with their slot name for slotted rendering. */
function attachSlot(children: RTNode[], slot?: string) {
  if (!slot) return;
  for (const child of children) {
    for (const node of rtDomNodes(child)) {
      if (node.nodeType !== 1) continue;
      if (slot === "default") (node as Element).removeAttribute("slot");
      else (node as Element).setAttribute("slot", slot);
    }
  }
}

/** Instantiates a list of plans into runtime nodes under `parent`. */
function instantiateChildren(
  plans: PlanNode[],
  parent: Node,
  locals: Locals
): RTNode[] {
  return plans.map((plan) => instantiateNode(plan, parent, locals));
}

/** Creates the live DOM and runtime wrapper for a single plan node. */
function instantiateNode(plan: PlanNode, parent: Node, locals: Locals): RTNode {
  if (plan.kind === "text") {
    const text = document.createTextNode(
      plan.segments.map((s) => ("text" in s ? s.text : "")).join("")
    );
    parent.appendChild(text);
    return { kind: "text", plan, node: text, locals };
  }
  if (plan.kind === "raw") {
    const node = plan.node.cloneNode(true);
    parent.appendChild(node);
    return { kind: "raw", plan, node };
  }
  if (plan.kind === "fragment") {
    const anchor = document.createComment("advect-fragment");
    parent.appendChild(anchor);
    const rt: RTFragment = {
      kind: "fragment",
      plan,
      parent,
      anchor,
      locals,
      children: [],
      items: plan.forSpec ? [] : undefined,
    };
    if (!plan.forSpec) {
      rt.children = instantiateChildren(plan.children, parent, locals);
      attachSlot(rt.children, plan.slot);
    }
    return rt;
  }

  if (plan.forSpec) {
    const anchor = document.createComment("advect-for");
    parent.appendChild(anchor);
    return {
      kind: "el",
      plan,
      el: null,
      parent,
      anchor,
      locals,
      refId: plan.ref,
      children: [],
      items: [],
    };
  }

  const live = plan.template.cloneNode(false) as Element;
  removeDirectives(live);
  let anchor: Comment | undefined;
  if (plan.ifSpec) {
    anchor = document.createComment("advect-if");
    parent.appendChild(anchor);
  }
  parent.appendChild(live);
  const rt: RTEl = {
    kind: "el",
    plan,
    el: live,
    parent,
    anchor,
    locals,
    refId: plan.ref,
    children: [],
  };
  rt.children = instantiateChildren(plan.children, live, locals);
  attachSlot(rt.children, undefined);
  return rt;
}

/** Normalizes a `v-for` source (number, string, array, iterable or object) into iterations. */
function iterateFor(value: any): { values: any[]; key: any }[] {
  if (value == null) return [];
  if (typeof value === "number") {
    const out: { values: any[]; key: any }[] = [];
    for (let i = 1; i <= value; i++) out.push({ values: [i], key: i - 1 });
    return out;
  }
  if (typeof value === "string") {
    return Array.from(value).map((v, i) => ({ values: [v, i], key: i }));
  }
  if (Array.isArray(value)) {
    return value.map((v, i) => ({ values: [v, i], key: i }));
  }
  if (typeof value === "object") {
    if (typeof (value as any)[Symbol.iterator] === "function") {
      return Array.from(value as Iterable<any>).map((v, i) => ({ values: [v, i], key: i }));
    }
    return Object.entries(value).map(([k, v], i) => ({
      values: [v, k, i],
      key: k,
    }));
  }
  return [];
}

/** Maps key event modifiers to their `KeyboardEvent.key` values. */
const KEY_MODIFIERS: Record<string, string> = {
  enter: "Enter",
  esc: "Escape",
  escape: "Escape",
  tab: "Tab",
  space: " ",
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  delete: "Delete",
  backspace: "Backspace",
};

/** Maps system event modifiers to their `Event` boolean properties. */
const SYSTEM_MODIFIERS: Record<string, string> = {
  ctrl: "ctrlKey",
  alt: "altKey",
  shift: "shiftKey",
  meta: "metaKey",
};

/** Compiles a component layout once and patches the live DOM on each render. */
export class AdvectRenderer {
  /** The host custom element being rendered. */
  #el: AdvectElement;
  /** The layout node the current plan was compiled from (detects layout swaps). */
  #layout: Node | null = null;
  /** The compiled render plan for the current layout. */
  #plan: PlanNode[] | null = null;
  /** Runtime nodes produced by the last mount. */
  #runtime: RTNode[] = [];
  /** Whether the runtime tree has been mounted into the DOM. */
  #mounted = false;
  /** Controls teardown of listeners registered by the renderer. */
  #abort = new AbortController();
  /** The context object for the most recent render. */
  #context: AdvectContext | null = null;

  constructor(el: AdvectElement) {
    this.#el = el;
  }

  /** Recompiles the layout when needed, mounts once, then patches the DOM. */
  render() {
    const el = this.#el;
    if (!el.isConnected) return;
    const layout = (el.$settings?.layout ?? null) as Node | null;
    if (!layout) return;

    if (this.#layout !== layout) {
      this.#abort.abort();
      this.#abort = new AbortController();
      this.#layout = layout;
      this.#plan = compileChildren(layout, Object.keys(el.$setup ?? {}));
      this.#mounted = false;
      this.#runtime = [];
    }

    const context = createAdvectContext(el);
    this.#context = context;
    if (!this.#mounted) this.mount(context);
    this.patch(this.#runtime, context);
  }

  /** Clears the DOM root and instantiates the compiled plan for the first time. */
  private mount(context: AdvectContext) {
    const root = this.#el.$domRoot;
    while (root.firstChild) root.removeChild(root.firstChild);
    this.#runtime = instantiateChildren(this.#plan ?? [], root, {
      ...(this.#el.$setup ?? {}),
    });
    this.#mounted = true;
  }

  /** Patches a list of runtime nodes against the current context. */
  private patch(nodes: RTNode[], context: AdvectContext) {
    for (const node of nodes) this.patchNode(node, context);
  }

  /** Patches one runtime node, dispatching on its kind. */
  private patchNode(rt: RTNode, context: AdvectContext) {
    if (rt.kind === "text") {
      this.patchText(rt, context);
      return;
    }
    if (rt.kind === "raw") return;
    if (rt.kind === "fragment") {
      this.patchFragment(rt, context);
      return;
    }

    const plan = rt.plan;
    if (plan.once && rt.onceDone) return;

    if (plan.forSpec) {
      this.patchFor(rt, context);
      if (plan.once) rt.onceDone = true;
      return;
    }

    if (plan.ifSpec) {
      const visible = !!safeEval(
        plan.ifSpec.fn,
        evalArgs(context, rt.locals, rt.el, this.#el),
        plan.ifSpec.source,
        rt.refId
      );
      const attached = rt.el!.parentNode === rt.parent;
      if (visible && !attached) {
        rt.parent.insertBefore(rt.el!, rt.anchor!.nextSibling);
      } else if (!visible && attached) {
        rt.parent.removeChild(rt.el!);
      }
      if (!visible) {
        if (plan.once) rt.onceDone = true;
        return;
      }
    }

    this.patchAttrs(rt, context);
    this.patchClass(rt, context);
    this.patchStyle(rt, context);
    this.patchBindObject(rt, context);
    this.patchShow(rt, context);

    if (plan.html) {
      this.patchHtml(rt, context);
    } else if (plan.text) {
      this.patchTextContent(rt, context);
    } else {
      for (const child of rt.children) this.patchNode(child, context);
    }

    this.bindEvents(rt, context);
    this.bindModel(rt, context);
    this.patchModel(rt, context);
    if (rt.refId) context.$$$refs.set(rt.refId, rt.locals);
    if (plan.once) rt.onceDone = true;
  }

  /** Patches a runtime fragment, toggling visibility/iteration of its child nodes. */
  private patchFragment(rt: RTFragment, context: AdvectContext) {
    const plan = rt.plan;
    if (plan.once && rt.onceDone) return;

    if (plan.forSpec) {
      this.patchFor(rt, context);
      if (plan.once) rt.onceDone = true;
      return;
    }

    if (plan.ifSpec) {
      const visible = !!safeEval(
        plan.ifSpec.fn,
        evalArgs(context, rt.locals, rt.anchor, this.#el),
        plan.ifSpec.source,
        ""
      );
      const nodes = rt.children.flatMap(rtDomNodes);
      const attached = nodes.length > 0 && nodes[0].parentNode === rt.parent;
      if (visible && !attached) {
        let cursor: Node = rt.anchor;
        for (const node of nodes) {
          rt.parent.insertBefore(node, cursor.nextSibling);
          cursor = node;
        }
      } else if (!visible && attached) {
        for (const node of nodes) {
          if (node.parentNode) node.parentNode.removeChild(node);
        }
      }
      if (!visible) {
        if (plan.once) rt.onceDone = true;
        return;
      }
    }

    for (const child of rt.children) this.patchNode(child, context);
    if (plan.once) rt.onceDone = true;
  }

  /** Recomputes a text node's value from its literal and interpolated segments. */
  private patchText(rt: RTText, context: AdvectContext) {
    let out = "";
    for (const seg of rt.plan.segments) {
      if ("text" in seg) {
        out += seg.text;
      } else {
        const value = safeEval(
          seg.fn,
          evalArgs(context, rt.locals, rt.node, this.#el),
          seg.source,
          ""
        );
        out += value == null ? "" : String(value);
      }
    }
    if (rt.node.nodeValue !== out) rt.node.nodeValue = out;
  }

  /** Applies compiled attribute bindings, handling boolean attributes specially. */
  private patchAttrs(rt: RTEl, context: AdvectContext) {
    const el = this.#el;
    for (const spec of rt.plan.attrs) {
      const value = safeEval(
        spec.fn,
        evalArgs(context, rt.locals, rt.el, el),
        spec.source,
        rt.refId
      );
      if (spec.isBoolean) {
        if (value) rt.el!.setAttribute(spec.name, "");
        else rt.el!.removeAttribute(spec.name);
      } else if (value == null || value === false) {
        if (rt.el!.hasAttribute(spec.name)) rt.el!.removeAttribute(spec.name);
      } else {
        const str = value === true ? "" : String(value);
        if (rt.el!.getAttribute(spec.name) !== str) {
          rt.el!.setAttribute(spec.name, str);
        }
      }
    }
  }

  /** Applies the `:class` binding on top of any static class attribute. */
  private patchClass(rt: RTEl, context: AdvectContext) {
    if (!rt.plan.classSpec) return;
    const value = safeEval(
      rt.plan.classSpec.fn,
      evalArgs(context, rt.locals, rt.el, this.#el),
      rt.plan.classSpec.source,
      rt.refId
    );
    const combined = `${rt.plan.staticClass} ${normalizeClass(value)}`.trim();
    if (rt.el!.getAttribute("class") !== combined) {
      if (combined) rt.el!.setAttribute("class", combined);
      else rt.el!.removeAttribute("class");
    }
  }

  /** Applies the `:style` binding, clearing previously set inline properties first. */
  private patchStyle(rt: RTEl, context: AdvectContext) {
    if (!rt.plan.styleSpec) return;
    const value = safeEval(
      rt.plan.styleSpec.fn,
      evalArgs(context, rt.locals, rt.el, this.#el),
      rt.plan.styleSpec.source,
      rt.refId
    );
    const style = (rt.el as HTMLElement).style;
    if (!style) return;
    rt.styleKeys = rt.styleKeys ?? new Set();
    for (const key of rt.styleKeys) style.removeProperty(key);
    const keys = new Set<string>();
    for (const [name, val] of styleEntries(value)) {
      const prop = styleToKebab(name);
      style.setProperty(prop, val);
      keys.add(prop);
    }
    rt.styleKeys = keys;
  }

  /** Applies a `v-bind` object, adding new attributes and removing dropped ones. */
  private patchBindObject(rt: RTEl, context: AdvectContext) {
    if (!rt.plan.bindObject) return;
    const obj = safeEval(
      rt.plan.bindObject.fn,
      evalArgs(context, rt.locals, rt.el, this.#el),
      rt.plan.bindObject.source,
      rt.refId
    );
    const record = obj && typeof obj === "object" ? obj : {};
    const keys = new Set(Object.keys(record));
    rt.boundKeys = rt.boundKeys ?? new Set();
    for (const key of rt.boundKeys) {
      if (!keys.has(key)) rt.el!.removeAttribute(key);
    }
    for (const [key, value] of Object.entries(record)) {
      if (key === "class") {
        const combined = `${rt.plan.staticClass} ${normalizeClass(value)}`.trim();
        if (combined) rt.el!.setAttribute("class", combined);
      } else if (key === "style") {
        for (const [name, val] of styleEntries(value)) {
          (rt.el as HTMLElement).style?.setProperty(styleToKebab(name), val);
        }
      } else if (value == null || value === false) {
        rt.el!.removeAttribute(key);
      } else if (value === true) {
        rt.el!.setAttribute(key, "");
      } else {
        rt.el!.setAttribute(key, String(value));
      }
    }
    rt.boundKeys = keys;
  }

  /** Toggles `display:none` for `v-show`, restoring the original value when shown. */
  private patchShow(rt: RTEl, context: AdvectContext) {
    if (!rt.plan.show) return;
    const visible = !!safeEval(
      rt.plan.show.fn,
      evalArgs(context, rt.locals, rt.el, this.#el),
      rt.plan.show.source,
      rt.refId
    );
    const style = (rt.el as HTMLElement).style;
    if (!style) return;
    if (!visible) {
      if (rt.showOriginal === undefined) rt.showOriginal = style.display;
      style.display = "none";
    } else if (rt.showOriginal !== undefined) {
      style.display = rt.showOriginal;
      rt.showOriginal = undefined;
    }
  }

  /** Sets `innerHTML` from the `v-html` binding, skipping unchanged values. */
  private patchHtml(rt: RTEl, context: AdvectContext) {
    if (!rt.plan.html) return;
    const value = safeEval(
      rt.plan.html.fn,
      evalArgs(context, rt.locals, rt.el, this.#el),
      rt.plan.html.source,
      rt.refId
    );
    const html = value == null ? "" : String(value);
    if (rt.lastHtml !== html) {
      rt.el!.innerHTML = html;
      rt.lastHtml = html;
    }
  }

  /** Sets `textContent` from the `v-text` binding, skipping unchanged values. */
  private patchTextContent(rt: RTEl, context: AdvectContext) {
    if (!rt.plan.text) return;
    const value = safeEval(
      rt.plan.text.fn,
      evalArgs(context, rt.locals, rt.el, this.#el),
      rt.plan.text.source,
      rt.refId
    );
    const text = value == null ? "" : String(value);
    if (rt.el!.textContent !== text) rt.el!.textContent = text;
  }

  /** Registers event listeners once per element, honoring modifier-derived options. */
  private bindEvents(rt: RTEl, context: AdvectContext) {
    if (rt.eventsBound || rt.plan.events.length === 0) return;
    rt.eventsBound = true;
    const target = rt.el!;
    const signal = (rt.abort ?? this.#abort).signal;
    for (const spec of rt.plan.events) {
      const options: AddEventListenerOptions = { signal };
      if (spec.modifiers.includes("once")) options.once = true;
      if (spec.modifiers.includes("capture")) options.capture = true;
      if (spec.modifiers.includes("passive")) options.passive = true;
      target.addEventListener(
        spec.name,
        (event: Event) => this.runEvent(spec, rt, event),
        options
      );
    }
  }

  /** Runs an event handler after applying `self`/key/`prevent`/`stop` modifiers. */
  private runEvent(spec: EventSpec, rt: RTEl, event: Event) {
    if (spec.modifiers.includes("self") && event.target !== event.currentTarget) {
      return;
    }
    if (!this.keyModifiersMatch(spec.modifiers, event)) return;
    if (spec.modifiers.includes("prevent")) event.preventDefault();
    if (spec.modifiers.includes("stop")) event.stopPropagation();

    const context = this.#context!;
    const el = this.#el;
    const run = () => {
      const result = spec.fn(
        context,
        rt.locals,
        event,
        el,
        el.$state,
        el.state,
        el.$attr
      );
      if (spec.expression && typeof result === "function") {
        return result.call(rt.el, event);
      }
      return result;
    };
    const eff = Effect.tryPromise({
      try: () => Promise.resolve(run()),
      catch: (cause) => new AdvectEventHandlerError(spec.source, rt.refId, cause),
    });
    void Effect.runPromise(
      Effect.catch(eff, (e: any) =>
        Effect.logError(`[advect] event handler failed: ${spec.source}`, e)
      )
    );
  }

  /** True when all key/system modifiers (and `exact`) match the given event. */
  private keyModifiersMatch(modifiers: string[], event: Event) {
    let ok = true;
    for (const modifier of modifiers) {
      const key = KEY_MODIFIERS[modifier];
      if (key !== undefined && (event as KeyboardEvent).key !== key) ok = false;
    }
    const specified = modifiers.filter((m) => SYSTEM_MODIFIERS[m]);
    for (const modifier of specified) {
      if (!(event as any)[SYSTEM_MODIFIERS[modifier]]) ok = false;
    }
    if (modifiers.includes("exact")) {
      for (const [mod, prop] of Object.entries(SYSTEM_MODIFIERS)) {
        if (!specified.includes(mod) && (event as any)[prop]) ok = false;
      }
    }
    return ok;
  }

  /** Wires input/change listeners that write DOM values back through the model setter. */
  private bindModel(rt: RTEl, context: AdvectContext) {
    const model = rt.plan.model;
    if (!model || rt.modelBound) return;
    rt.modelBound = true;
    const el = rt.el as HTMLInputElement;
    const signal = (rt.abort ?? this.#abort).signal;
    const tag = rt.el!.tagName.toLowerCase();
    const type = (rt.el!.getAttribute("type") ?? "").toLowerCase();

    const commit = (raw: any) => {
      let value = raw;
      if (model.modifiers.includes("number") && typeof value === "string") {
        const parsed = parseFloat(value);
        value = Number.isNaN(parsed) ? value : parsed;
      }
      if (model.modifiers.includes("trim") && typeof value === "string") {
        value = value.trim();
      }
      const ctx = this.#context!;
      safeEval(
        model.setter,
        [...evalArgs(ctx, rt.locals, rt.el, this.#el), value],
        model.target,
        rt.refId
      );
    };

    if (tag === "input" && type === "checkbox") {
      el.addEventListener(
        "change",
        () => {
          const ctx = this.#context!;
          const current = safeEval(
            model.getter,
            evalArgs(ctx, rt.locals, rt.el, this.#el),
            model.target,
            rt.refId
          );
          if (Array.isArray(current)) {
            const value = el.value;
            const index = current.indexOf(value);
            if (el.checked && index === -1) current.push(value);
            else if (!el.checked && index !== -1) current.splice(index, 1);
            this.#el.$scheduleRender();
          } else {
            commit(el.checked);
          }
        },
        { signal }
      );
    } else if (tag === "input" && type === "radio") {
      el.addEventListener(
        "change",
        () => {
          if (el.checked) commit(el.value);
        },
        { signal }
      );
    } else if (tag === "select") {
      el.addEventListener(
        "change",
        () => {
          if (el.multiple) {
            commit(Array.from(el.selectedOptions).map((o) => o.value));
          } else {
            commit(el.value);
          }
        },
        { signal }
      );
    } else {
      const eventName = model.modifiers.includes("lazy") ? "change" : "input";
      el.addEventListener(eventName, () => commit(el.value), { signal });
    }
  }

  /** Pushes the current model value back into the form control's DOM state. */
  private patchModel(rt: RTEl, context: AdvectContext) {
    const model = rt.plan.model;
    if (!model) return;
    const el = rt.el as HTMLInputElement;
    const current = safeEval(
      model.getter,
      evalArgs(context, rt.locals, rt.el, this.#el),
      model.target,
      rt.refId
    );
    const tag = rt.el!.tagName.toLowerCase();
    const type = (rt.el!.getAttribute("type") ?? "").toLowerCase();

    if (tag === "input" && type === "checkbox") {
      if (Array.isArray(current)) {
        el.checked = current.map(String).includes(el.value);
      } else {
        el.checked = !!current;
      }
    } else if (tag === "input" && type === "radio") {
      el.checked = String(current) === el.value;
    } else if (tag === "select") {
      if (el.multiple) {
        const values = Array.isArray(current) ? current.map(String) : [];
        for (const option of Array.from((el as HTMLSelectElement).options)) {
          option.selected = values.includes(option.value);
        }
      } else {
        el.value = current == null ? "" : String(current);
      }
    } else {
      const next = current == null ? "" : String(current);
      if (el.value !== next) el.value = next;
    }
  }

  /** Diffs a `v-for` list, reusing keyed items and reordering/creating/removing as needed. */
  private patchFor(rt: RTEl | RTFragment, context: AdvectContext) {
    const plan = rt.plan as any;
    const spec: ForSpec = plan.forSpec;
    const parent = rt.parent;

    if (plan.ifSpec) {
      const visible = !!safeEval(
        plan.ifSpec.fn,
        evalArgs(context, rt.locals, this.#el, this.#el),
        plan.ifSpec.source,
        (rt as RTEl).refId ?? ""
      );
      if (!visible) {
        for (const item of rt.items ?? []) {
          for (const node of item.nodes) {
            for (const dom of rtDomNodes(node)) {
              if (dom.parentNode) dom.parentNode.removeChild(dom);
            }
            (node as RTEl).abort?.abort();
          }
        }
        rt.items = [];
        return;
      }
    }

    const array = safeEval(
      spec.arrayFn,
      evalArgs(context, rt.locals, this.#el, this.#el),
      spec.arraySource,
      (rt as RTEl).refId ?? ""
    );
    const entries = iterateFor(array);

    const old = new Map<string, RTItem>();
    for (const item of rt.items ?? []) old.set(item.key, item);

    const next: RTItem[] = [];
    const used = new Set<string>();
    let cursor: Node = rt.anchor!;

    entries.forEach((entry, index) => {
      const locals: Locals = { ...rt.locals };
      spec.names.forEach((name, i) => {
        if (name) locals[name] = entry.values[i];
      });

      let key = spec.keyFn
        ? String(
            safeEval(
              spec.keyFn,
              evalArgs(context, locals, this.#el, this.#el),
              spec.keySource ?? "",
              (rt as RTEl).refId ?? ""
            )
          )
        : String(entry.key ?? index);
      if (used.has(key)) key = `${key}_${index}`;
      used.add(key);

      let item = old.get(key);
      if (item) {
        item.locals = locals;
        old.delete(key);
      } else {
        item = this.createItem(rt, locals, key);
      }
      next.push(item);
      if (item.refId) context.$$$refs.set(item.refId, locals);

      for (const node of item.nodes) this.patchNode(node, context);
      for (const node of item.nodes) {
        for (const dom of rtDomNodes(node)) {
          if (dom.parentNode !== parent || dom.previousSibling !== cursor) {
            parent.insertBefore(dom, cursor.nextSibling);
          }
          cursor = dom;
        }
      }
    });

    for (const item of old.values()) {
      if (item.refId) context.$$$refs.delete(item.refId);
      for (const node of item.nodes) {
        for (const dom of rtDomNodes(node)) {
          if (dom.parentNode) dom.parentNode.removeChild(dom);
        }
        (node as RTEl).abort?.abort();
      }
    }
    rt.items = next;
  }

  /** Creates a new runtime item for one `v-for` iteration. */
  private createItem(rt: RTEl | RTFragment, locals: Locals, key: string): RTItem {
    const plan = rt.plan as any;
    if (rt.kind === "el") {
      const live = plan.template.cloneNode(false) as Element;
      removeDirectives(live);
      const refId = rt.refId ? `${rt.refId}_${key}` : "";
      if (refId) live.setAttribute("ref", refId);
      const itemRT: RTEl = {
        kind: "el",
        plan: { ...plan, forSpec: undefined, ifSpec: undefined },
        el: live,
        parent: rt.parent,
        anchor: undefined,
        locals,
        refId,
        children: [],
        abort: new AbortController(),
      };
      itemRT.children = instantiateChildren(plan.children, live, locals);
      return { key, refId, locals, nodes: [itemRT] };
    }
    const nodes = instantiateChildren(
      (rt as RTFragment).plan.children,
      rt.parent,
      locals
    );
    return { key, refId: "", locals, nodes };
  }
}
