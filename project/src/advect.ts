import {
  AdvectSettings,
  decodePropertySyntax,
  getDefaultElementSettings,
  getScriptVars,
  toModule,
  type AvectVMProvider,
  type CustomElementSettings,
} from "./advect.lib";
import { AdvectElement } from "./advect.element";

/** URLs of component files that have already been fetched, so circular imports terminate. */
const loaded = new Set<string>();
/** Registry of every parsed component, keyed by its custom element tag name. */
const components = new Map<string, CustomElementSettings>();

/** Returns the registry of all parsed component settings keyed by tag name. */
export function getAllComponents() {
  return components;
}

/**
 * A static import statement discovered in a module script
 */
export interface StaticImport {
  specifier: string;
  full: string;
  index: number;
}

/** True when a module specifier points at an Advect component file, judged by its extension. */
export function isComponentSpecifier(specifier: string): boolean {
  const clean = specifier.split(/[?#]/)[0].toLowerCase();
  return AdvectSettings.data.componentExtensions.some((ext) => clean.endsWith(ext));
}

/**
 * Finds the end of an import statement starting at `start`.
 * Tracks strings, comments and bracket depth so multi-line binding imports
 * work without ever crossing into a following statement.
 */
function findStatementEnd(source: string, start: number): number {
  let i = start;
  let depth = 0;
  let string: string | null = null;
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];
    if (string) {
      if (ch === "\\") {
        i += 2;
        continue;
      }
      if (ch === string) string = null;
      i++;
      continue;
    }
    if (ch === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      string = ch;
      i++;
      continue;
    }
    if (ch === "{" || ch === "(" || ch === "[") depth++;
    else if (ch === "}" || ch === ")" || ch === "]") depth--;
    else if (ch === ";" && depth === 0) {
      i++;
      break;
    } else if (ch === "\n" && depth === 0) {
      break;
    }
    i++;
  }
  return i;
}

/**
 * Parses static `import` statements (side-effect and binding imports).
 * Dynamic `import()` and `import.meta` are intentionally ignored.
 */
export function parseStaticImports(source: string): StaticImport[] {
  const out: StaticImport[] = [];
  const re = /^[ \t]*import\b/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    const start = match.index;
    const after = source.slice(start + match[0].length).replace(/^[ \t]+/, "");
    if (after.startsWith("(") || after.startsWith(".")) {
      re.lastIndex = findStatementEnd(source, start);
      continue;
    }
    const end = findStatementEnd(source, start);
    const full = source.slice(start, end);
    const specMatch = full.match(/['"]([^'"]+)['"]/);
    if (specMatch) out.push({ specifier: specMatch[1], full, index: start });
    re.lastIndex = end;
  }
  return out;
}

/** Replaces each import statement with spaces so offsets/newlines are preserved. */
function blankStatements(source: string, imports: StaticImport[]): string {
  let result = source;
  for (let i = imports.length - 1; i >= 0; i--) {
    const imp = imports[i];
    const blank = imp.full.replace(/[^\n]/g, " ");
    result = result.slice(0, imp.index) + blank + result.slice(imp.index + imp.full.length);
  }
  return result;
}

/**
 * Replaces comments and string/template-literal contents with spaces while
 * preserving offsets and newlines, so declaration scanning never trips on them.
 */
function maskNonCode(source: string): string {
  const out = source.split("");
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];
    if (ch === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") out[i++] = " ";
      continue;
    }
    if (ch === "/" && next === "*") {
      out[i++] = " ";
      out[i++] = " ";
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) {
        if (source[i] !== "\n") out[i] = " ";
        i++;
      }
      if (i < source.length) {
        out[i++] = " ";
        out[i++] = " ";
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      out[i++] = " ";
      while (i < source.length) {
        if (source[i] === "\\") {
          out[i++] = " ";
          if (i < source.length) out[i++] = " ";
          continue;
        }
        if (source[i] === quote) {
          out[i++] = " ";
          break;
        }
        if (source[i] !== "\n") out[i] = " ";
        i++;
      }
      continue;
    }
    i++;
  }
  return out.join("");
}

/** Returns the bracket depth at each character index of a masked source. */
function depthMap(masked: string): number[] {
  const depths = new Array<number>(masked.length).fill(0);
  let depth = 0;
  for (let i = 0; i < masked.length; i++) {
    const ch = masked[i];
    if (ch === "}" || ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
    depths[i] = depth;
    if (ch === "{" || ch === "(" || ch === "[") depth++;
  }
  return depths;
}

/** Splits a string on `sep` occurring at bracket depth 0. */
function splitTopLevel(source: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{" || ch === "(" || ch === "[") depth++;
    else if (ch === "}" || ch === ")" || ch === "]") depth--;
    else if (ch === sep && depth === 0) {
      parts.push(source.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(source.slice(start));
  return parts;
}

/** Index of `token` at bracket depth 0, or -1. */
function topLevelIndexOf(source: string, token: string): number {
  let depth = 0;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{" || ch === "(" || ch === "[") depth++;
    else if (ch === "}" || ch === ")" || ch === "]") depth--;
    else if (ch === token && depth === 0) return i;
  }
  return -1;
}

/** Extracts the identifiers bound by a single binding pattern (name, object or array). */
function extractPatternNames(pattern: string): string[] {
  const names: string[] = [];
  const trimmed = pattern.trim();
  if (!trimmed) return names;
  const eq = topLevelIndexOf(trimmed, "=");
  const base = (eq !== -1 ? trimmed.slice(0, eq) : trimmed).trim();
  if (!base) return names;
  if (base.startsWith("...")) return extractPatternNames(base.slice(3));
  if (base.startsWith("{") || base.startsWith("[")) {
    const last = base[base.length - 1];
    const inner =
      last === "}" || last === "]" ? base.slice(1, -1) : base.slice(1);
    for (const part of splitTopLevel(inner, ",")) {
      const p = part.trim();
      if (!p) continue;
      const colon = topLevelIndexOf(p, ":");
      if (colon !== -1) {
        names.push(...extractPatternNames(p.slice(colon + 1)));
        continue;
      }
      names.push(...extractPatternNames(p));
    }
    return names;
  }
  if (/^[A-Za-z_$][\w$]*$/.test(base)) names.push(base);
  return names;
}

/**
 * Collects the identifiers bound by top-level declarations in a script.
 * Tolerant, comment/string/bracket-aware scan; not a full JavaScript parser.
 */
export function collectTopLevelNames(source: string): string[] {
  const masked = maskNonCode(source);
  const depths = depthMap(masked);
  const names: string[] = [];
  const seen = new Set<string>();
  const add = (name: string) => {
    if (name && !seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  };
  const keyword = /\b(const|let|var|function|class)\b/g;
  let match: RegExpExecArray | null;
  while ((match = keyword.exec(masked))) {
    const index = match.index;
    if (depths[index] !== 0) continue;
    const prev = masked[index - 1];
    if (prev === "." || /[\w$]/.test(prev ?? "")) continue;
    const kind = match[1];
    const after = index + match[0].length;
    if (kind === "function" || kind === "class") {
      const nameMatch = masked.slice(after).match(/^\s*\*?\s*([A-Za-z_$][\w$]*)/);
      if (nameMatch) add(nameMatch[1]);
      continue;
    }
    const end = findStatementEnd(masked, after);
    const declaration = masked.slice(after, end);
    for (const part of splitTopLevel(declaration, ",")) {
      for (const name of extractPatternNames(part)) add(name);
    }
  }
  return names;
}

/**
 * Wraps a component's `<script setup>` body into an executable module.
 * The generated default export injects the element context, runs the authored
 * body, and returns its top-level declarations (bindings and hook functions).
 * Component import statements are blanked so the data: URL module never tries
 * to fetch a `.vue` file as JavaScript.
 */
export function prepareSetup(source: string): { imports: string[]; module: string } {
  const parsed = parseStaticImports(source);
  const componentImports = parsed.filter((p) => isComponentSpecifier(p.specifier));
  // Every static import is removed from the body: component imports are handled
  // by the loader, while plain imports are hoisted to the module top level.
  const body = blankStatements(source, parsed);
  const declared = collectTopLevelNames(body);
  const hoisted = parsed
    .filter((p) => !isComponentSpecifier(p.specifier))
    .map((p) => p.full.trim());

  const context: Record<string, any> = {};
  for (const key of AdvectSettings.setup.context) context[key] = null;
  const prelude = getScriptVars(context, "$$$context", declared);

  const module = [
    ...hoisted,
    "export default function ($$$context) {",
    prelude,
    body,
    `return { ${declared.join(", ")} };`,
    "}",
  ].join("\n");

  return {
    imports: componentImports.map((p) => p.specifier),
    module,
  };
}

/** Matches a single CSS `@import` rule up to its terminating semicolon. */
const AT_IMPORT_RE = /@import[^;]*;/g;

/**
 * `@import` rules are not reliably supported inside constructable/adopted
 * stylesheets, so they are split out and rendered as a real <style> node
 * inside the component root (which also keeps relative url() working).
 */
function splitImports(css: string): { imports: string; rules: string } {
  const imports: string[] = [];
  const rules = css.replace(AT_IMPORT_RE, (rule) => {
    imports.push(rule);
    return "";
  });
  return { imports: imports.join("\n"), rules };
}

/** Resolves a specifier against a base URL, falling back to the raw specifier on failure. */
export function resolveUrl(specifier: string, baseUrl: string): string {
  try {
    const base =
      baseUrl ||
      (typeof document !== "undefined" && document.baseURI) ||
      (typeof location !== "undefined" ? location.href : "");
    if (!base) return specifier;
    return new URL(specifier, base).href;
  } catch {
    return specifier;
  }
}

/** Parses a Document into component settings from its single `<template advect="...">`. */
export const cweSettingsFromDoc = (
  doc: Document,
  baseUrl = ""
): CustomElementSettings[] => {
  if (!doc) return [];
  const settings: CustomElementSettings[] = [];
  const templates = Array.from(
    doc.querySelectorAll(`template[${AdvectSettings.attributes.template}]`)
  ) as HTMLTemplateElement[];

  if (templates.length > 1) {
    console.error(
      `[advect] only a single component per file is allowed, found ${templates.length}`
    );
    return [];
  }

  for (const template of templates) {
    const content = template.content.cloneNode(true) as DocumentFragment;
    const setting = getDefaultElementSettings();
    setting.sourceUrl = baseUrl;
    setting.tagName =
      template.getAttribute(AdvectSettings.attributes.template) ?? "";
    if (template.hasAttribute("root")) {
      setting.root = template.getAttribute("root") as
        | "light"
        | "shadow"
        | "none";
    }
    if (template.hasAttribute("shadow")) {
      setting.shadow = template.getAttribute("shadow") as "open" | "closed";
    }

    // <datalist> declares watched attributes and is not part of the layout.
    const datalist = content.querySelector(AdvectSettings.tags.settings);
    if (datalist) {
      Array.from(datalist.children)
        .map((child) => {
          if (child.nodeName == "OPTION") {
            return {
              name: child.getAttribute("name"),
              type: child.getAttribute("type"),
            };
          }
        })
        .filter((v) => v?.name)
        .forEach((v) => {
          setting.watched[v?.name ?? ""] = {
            type: (v?.type ?? "string") as any,
          };
        });
      datalist.remove();
    }

    // The template content itself is the layout now; <layout> is no longer used.
    setting.layout = content;

    // The setup script and styles are top-level siblings of the template,
    // never descendants of it.
    const setupScript = Array.from(
      doc.querySelectorAll("script[setup]")
    ).find((script) => !template.contains(script) && !script.hasAttribute("src"));

    if (setupScript) {
      const prepared = prepareSetup(setupScript.textContent ?? "");
      setting.module = prepared.module;
      setting.imports = prepared.imports;
    }

    const styleElements = Array.from(doc.querySelectorAll("style")).filter(
      (style) => !template.contains(style)
    );
    const { imports: atImports, rules } = splitImports(
      styleElements.map((style) => style.textContent ?? "").join("\n")
    );
    setting.style = rules;
    if (atImports && setting.layout) {
      const ownerDoc = template.ownerDocument ?? doc;
      const styleNode = ownerDoc.createElement("style");
      styleNode.textContent = atImports;
      setting.layout.appendChild(styleNode);
    }

    settings.push(setting);
  }
  return settings;
};

/** Parses an HTML string into component settings via `DOMParser`. */
export const cweSettingsFromString = (htmlString: string, baseUrl = "") => {
  try {
    const docParser = new DOMParser();
    const doc = docParser.parseFromString(htmlString, "text/html");
    return cweSettingsFromDoc(doc, baseUrl);
  } catch (e) {
    console.error(e);
    return [];
  }
};

/**
 * Fetches and parses one or more component files. Already loaded urls are
 * skipped so circular component imports terminate.
 */
const cweFromUrls = async (
  urls: string | string[],
  baseUrl = ""
): Promise<CustomElementSettings[]> => {
  const list: string[] = Array.isArray(urls) ? urls : [urls];
  const resolved = list.map((url) => resolveUrl(url, baseUrl));
  const toLoad = resolved.filter((url) => !loaded.has(url));
  toLoad.forEach((url) => loaded.add(url));

  const results = await Promise.all(
    toLoad.map(async (url) => {
      try {
        const text = await fetch(url).then((r) => r.text());
        return cweSettingsFromString(text, url);
      } catch (e) {
        console.error(`[advect] failed to load component ${url}`, e);
        return [];
      }
    })
  );

  return results.flat();
};

/** Resolves, loads and (optionally) registers the component imports of each settings entry. */
async function loadImportedComponents(
  settingsList: CustomElementSettings[],
  register: boolean
) {
  const imports: string[] = [];
  for (const settings of settingsList) {
    for (const specifier of settings.imports) {
      imports.push(resolveUrl(specifier, settings.sourceUrl));
    }
  }
  if (imports.length === 0) return;
  const children = await cweFromUrls(imports);
  if (children.length > 0) {
    await createCustomElementClasses(children, register);
  }
}

/** Builds custom element classes for the settings and registers them when `register` is true. */
export const createCustomElementClasses = async (
  buildSettings: CustomElementSettings[],
  register = true
): Promise<any[]> => {
  const buildClasses: any[] = [];

  await loadImportedComponents(buildSettings, register);

  for (const settings of buildSettings) {
    components.set(settings.tagName, settings);
    if (customElements.get(settings.tagName)) {
      console.warn(`Already registered ${settings.tagName}`);
      continue;
    }

    const module: any = await toModule(settings.module, []);
    const stylesheet = new CSSStyleSheet();
    stylesheet.replace(decodePropertySyntax(settings.style));

    // for some reason ts thinks settings is used before being declared so let's add a pointer
    const $settings = settings;
    const newClass = class extends AdvectElement {
      static observedAttributes = Object.keys($settings.watched);
      static $settings = $settings;
      static $stylesheet = stylesheet;
      static $advectVMProvider: AvectVMProvider = module?.default;
      connectedCallback(): void {
        super.connectedCallback();
      }
    };
    if (
      register &&
      $settings.tagName.length >= 3 &&
      $settings.tagName.indexOf("-") !== -1 &&
      customElements.get($settings.tagName) === undefined
    ) {
      customElements.define($settings.tagName, newClass as any);
    }
    buildClasses.push(newClass);
  }

  return buildClasses;
};

/** Entry point that scans the page for inline components and `<script type="advect">` imports. */
const onContent = (_: Event | null) => {
  const baseUrl =
    typeof document !== "undefined" ? document.baseURI || "" : "";

  // A component defined inline in the page itself
  const inlineSettings = cweSettingsFromDoc(document, baseUrl);
  if (inlineSettings.length > 0) {
    void createCustomElementClasses(inlineSettings);
  }

  // Entry point(s): <script type="advect">import "./root.vue";</script>
  const entryImports: string[] = [];
  Array.from(
    document.querySelectorAll(
      `script[type="${AdvectSettings.attributes.scriptType}"]`
    )
  ).forEach((script) => {
    for (const parsed of parseStaticImports(script.textContent ?? "")) {
      entryImports.push(parsed.specifier);
    }
  });

  if (entryImports.length > 0) {
    cweFromUrls(entryImports, baseUrl).then((s) => {
      void createCustomElementClasses(s, true);
    });
  }

  document.removeEventListener("DOMContentLoaded", onContent);
};

if (document.readyState !== "loading") {
  onContent(null);
} else {
  document.addEventListener("DOMContentLoaded", onContent);
}
/** Public browser global exposing runtime helpers for introspection. */
//@ts-ignore
window.advect = {
  getAllComponents,
  createCustomElementClasses,
  cweSettingsFromString,
  cweFromUrls,
  parseStaticImports,
  isComponentSpecifier,
};
