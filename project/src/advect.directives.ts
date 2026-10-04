/** A parsed `v-for` directive: the binding names and the iterated expression. */
export interface ForDirective {
  names: string[];
  source: string;
}

/** A parsed `:attr`/`v-bind:attr` binding. */
export interface BindingSpec {
  arg: string;
  source: string;
}

/** A parsed `@event`/`v-on:event` directive including its modifiers. */
export interface EventDirective {
  name: string;
  source: string;
  modifiers: string[];
}

/** A parsed `v-model` directive including its modifiers. */
export interface ModelDirective {
  target: string;
  modifiers: string[];
}

/** A parsed `v-slot`/`#name` directive. */
export interface SlotDirective {
  name: string;
  scoped: boolean;
}

/** The full set of directives found on a single element. */
export interface DirectiveSet {
  for?: ForDirective;
  if?: string;
  elseIf?: string;
  else?: boolean;
  show?: string;
  html?: string;
  text?: string;
  once?: boolean;
  pre?: boolean;
  slot?: SlotDirective;
  key?: string;
  bindings: BindingSpec[];
  bindObject?: string;
  events: EventDirective[];
  model?: ModelDirective;
}

/** Matches a `v-for` expression: `(item, i) in list` / `item of list`. */
const FOR_RE = /^\s*\(?([^)]+?)\)?\s+(?:in|of)\s+([\s\S]+)$/i;

/** Parses a `v-for` directive value into binding names and the source expression. */
export function parseFor(value: string): ForDirective | undefined {
  const match = value.match(FOR_RE);
  if (!match) return undefined;
  const names = match[1]
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return { names, source: match[2].trim() };
}

/** Splits `name.modifier.modifier` into the base name and modifier list. */
function splitModifiers(value: string): { name: string; modifiers: string[] } {
  const parts = value.split(".");
  return { name: parts.shift() ?? "", modifiers: parts };
}

/** Collects and parses every Advect directive attribute on an element. */
export function parseDirectives(el: Element): DirectiveSet {
  const set: DirectiveSet = { bindings: [], events: [] };

  for (const attr of Array.from(el.attributes)) {
    const name = attr.name;
    const value = attr.value;

    if (name.startsWith("v-on:")) {
      const { name: event, modifiers } = splitModifiers(name.slice(5));
      set.events.push({ name: event, source: value, modifiers });
      continue;
    }
    if (name.startsWith("@")) {
      const { name: event, modifiers } = splitModifiers(name.slice(1));
      set.events.push({ name: event, source: value, modifiers });
      continue;
    }
    if (name.startsWith("v-bind:")) {
      const arg = name.slice(7);
      if (arg === "key") set.key = value;
      else set.bindings.push({ arg, source: value });
      continue;
    }
    if (name.startsWith(":")) {
      const arg = name.slice(1);
      if (arg === "key") set.key = value;
      else set.bindings.push({ arg, source: value });
      continue;
    }
    if (name.startsWith("v-slot:") || name.startsWith("#")) {
      const slotName = name.startsWith("#") ? name.slice(1) : name.slice(7);
      set.slot = { name: slotName || "default", scoped: value.length > 0 };
      continue;
    }

    switch (name) {
      case "v-if":
        set.if = value;
        break;
      case "v-else-if":
        set.elseIf = value;
        break;
      case "v-else":
        set.else = true;
        break;
      case "v-for":
        set.for = parseFor(value);
        break;
      case "v-show":
        set.show = value;
        break;
      case "v-html":
        set.html = value;
        break;
      case "v-text":
        set.text = value;
        break;
      case "v-once":
        set.once = true;
        break;
      case "v-pre":
        set.pre = true;
        break;
      case "v-model":
        set.model = { target: value, modifiers: [] };
        break;
      case "v-bind":
        set.bindObject = value;
        break;
      case "v-slot":
        set.slot = { name: "default", scoped: value.length > 0 };
        break;
      default:
        if (name.startsWith("v-model.")) {
          const modifiers = name
            .slice(8)
            .split(".")
            .filter(Boolean);
          set.model = { target: value, modifiers };
        }
        break;
    }
  }

  return set;
}

/** True when the element carries at least one Advect directive. */
export function hasDirectives(el: Element): boolean {
  const d = parseDirectives(el);
  return !!(
    d.for ||
    d.if ||
    d.elseIf ||
    d.else ||
    d.show ||
    d.html ||
    d.text ||
    d.once ||
    d.pre ||
    d.slot ||
    d.bindObject ||
    d.model ||
    d.bindings.length ||
    d.events.length
  );
}

/** True when an attribute name is an Advect directive prefix (`v-`, `:`, `@`, `#`). */
export function isDirectiveAttribute(name: string): boolean {
  return (
    name.startsWith("v-") ||
    name.startsWith(":") ||
    name.startsWith("@") ||
    name.startsWith("#")
  );
}
