import type { AdvectElement } from "./advect.element";

/** Names of the supported watched-attribute types. */
export type AttrTypeKey = keyof typeof AttrTypes;
/** The watched-attribute type descriptor map. */
export type AttrType = typeof AttrTypes;
/** Parse/store implementations for each watched-attribute type. */
export const AttrTypes = {
  int: {
    parse: (val: string) => {
      try {
        return parseInt(val);
      } catch (e) {
        return null;
      }
    },
    store(val: number) {
      return `${val}`;
    },
  },
  float: {
    parse: (val: string) => {
      try {
        return parseFloat(val);
      } catch (e) {
        return null;
      }
    },
    store(val: number) {
      return `${val}`;
    },
  },
  string: {
    parse: (val: string) => {
      return val;
    },
    store(val: number) {
      return val;
    },
  },
  bigint: {
    parse: (val: string) => {
      try {
        return BigInt(val);
      } catch (e) {
        return null;
      }
    },
    store(val: number) {
      return `${val}`;
    },
  },
  color: {},
};

/** Names of the supported attribute format hints. */
export type FormatTypeKey = keyof typeof FormatTypes;
/** The attribute format hint map. */
export type FormatType = typeof FormatTypes;
/** Placeholder format hints used by attribute declarations. */
const FormatTypes = {
  none: {},
  rgb: {},
  rgba: {},
  hsla: {},
  hex: {},
  px: {},
  rem: {},
  em: {},
  char: {},
};

/**
 * The description Object for a custom web element
 */
export interface CustomElementSettings {
  /**
   * The tag name of the custom component
   * uses the "id" attribute of the component
   */
  tagName: string;
  /**
   * The compiled JS module of the component.
   * Generated from the first top-level `<script setup>` with no "src" attribute;
   * it wraps the authored setup body and returns its top-level declarations.
   * Optional - a component renders without it.
   */
  module: string;
  /**
   * The template content (minus any <datalist>) used as the component layout.
   * This can be used to reference the original component markup without needing to access the browser APIs
   */
  layout: DocumentFragment | HTMLElement | Element | null;

  /**
   * Shadow Mode for the component
   */
  shadow: "open" | "closed";
  /**
   * Where the initial markup for the component will be placed
   * light for the light dom, shadow for the shadow dom
   */
  root: "light" | "shadow" | "none";
  /**
   * An object containing the watched attributes
   * Watched attributes are declared inside the template with
   * <datalist><option name="..." type="..."></datalist>
   * and are not added to the markup.
   */
  watched: {
    [key: string]: {
      type: AttrTypeKey;
      format?: string;
      defaultValue?: string;
      // storage: 'css-var' | 'store'
    };
  };

  style: string;

  logs: string[];

  /**
   * Component import specifiers found in the module script.
   * These are side-effect imports (eg. `import "./child.vue"`) that
   * reference other Advect component files.
   */
  imports: string[];

  /**
   * Absolute URL the component was loaded from.
   * Used to resolve relative component imports and for diagnostics.
   */
  sourceUrl: string;
}


/** Returns a fresh settings object with all fields at their defaults. */
export function getDefaultElementSettings(){
  return  {
      tagName: "",
      module: "",
      root: "light",
      shadow: "closed",
      watched: {},
      logs: [],
      layout: null,
      style: "",
      imports: [],
      sourceUrl: "",
    } as CustomElementSettings;
}

/** True when `attr` names a known watched-attribute type (case-insensitive). */
export function isValidAttrType(attr: string) {
  return (
    Object.keys(AttrTypes).find((t) => t.toLowerCase() == attr.toLowerCase()) !=
    null
  );
}

/**
 * Constructor for an async function.
 */
export const AsyncFunction = Object.getPrototypeOf(
  async function () {}
).constructor;

/**
 * Given a string creates a module
 * @param script the text of the module
 * @param inject strings to be added before the rest of the module script
 * @returns a module
 */
export function toModule(script: string, inject: string[]) {
  const encoded_uri =
    "data:text/javascript;charset=utf-8," +
    inject.join("\n") +
    encodeURIComponent(`${script}`);
  return import(/* @vite-ignore */ encoded_uri)
    .then((module) => module)
    .catch((err) => {
      console.error(err);
      return null;
    });
}

/**
 * Broadcast channel for console logs
 */

/** Removes all HTML comment nodes from a string. */
export function stripHtmlComments(htmlString: string) {
  return htmlString.replace(/<!--[\s\S]*?-->/g, "");
}

/**
 * Logs from anywhere
 * @param msg
 */

export interface AdvectVM {
  /**
   * Fired when element is connected for the first time
   */
  onConnect?: () => void;
  /**
   * Fired when element is disconnected
   */
  onDisconnect?: () => void;
  /**
   * Fires When any attribute is changed via the $el.attr property
   */
  onAttrChange?: (name: string, value: string, oldValue: string) => void;
  /**
   * Fires when watched Attributes are changed
   */
  onWatchedAttrChanged?: (
    name: string,
    value: string,
    oldValue: string
  ) => void;
  /**
   * Fires when element is moved within the same document
   */
  onMove?: () => void;
  /**
   * Fires when element is adopted to new document
   */
  onAdopt?: () => void;
}

/**
 * Factory generated from a component's `<script setup>`.
 * It receives the element context and returns the setup bindings
 * (auto-exposed values, including lifecycle hook functions).
 */
export type AvectVMProvider = (context: Record<string, any>) => Record<string, any>;

/** Global naming/settings constants used by the runtime and parser. */
export const AdvectSettings = {
  setup: {
    /**
     * Values injected as locals into a component's `<script setup>` body.
     * Declared names shadow these.
     */
    context: ["$state", "state", "$element", "$refs", "$attr", "$internals"],
    /**
     * Top-level setup functions automatically wired as the element's VM hooks.
     */
    lifecycleHooks: [
      "onConnect",
      "onDisconnect",
      "onMove",
      "onAdopt",
      "onWatchedAttrChanged",
    ],
  },
  data:{
    session_key : '$$$advect-loads',
    /**
     * Component files are plain html documents with a single
     * <template advect="..."> block plus a sibling script/style
     */
    componentExtensions: [".vue", ".html"],
  },
  tags: {
    layout: "layout",
    settings: "datalist",
    options: "option",
    onloadElements: [
      "body",
      "iframe",
      "img",
      "link",
      "object",
      "script",
      "style",
      "audio",
      "video",
    ],
     selfClosing : new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
  "att",
])
  },
  attributes: {
    booleans: ["checked", "disabled", "readonly", "popover"],
    /**
     * This will be the components name ie my-component
     */
    template: "advect",
    /**
     * The type used by the entry script that imports root components
     * eg. <script type="advect">import "./root.vue";</script>
     */
    scriptType: "advect",
    props_prefix: "prop-",
    ref_key: "ref",
    directives: {
      ifStatement: "v-if",
      elseIfStatement: "v-else-if",
      elseStatement: "v-else",
      forStatement: "v-for",
      showStatement: "v-show",
      modelStatement: "v-model",
      htmlStatement: "v-html",
      textStatement: "v-text",
      onceStatement: "v-once",
      preStatement: "v-pre",
      bindPrefix: "v-bind",
      onPrefix: "v-on",
      keyStatement: "v-bind:key",
      bindShort: ":",
      onShort: "@",
      slotShort: "#",
    },
  },
  events: [
    "onclick",
    "ondblclick",
    "onmousedown",
    "onmouseup",
    "onmousemove",
    "onmouseover",
    "onmouseout",
    "oncontextmenu",
    "onwheel",
    "onkeydown",
    "onkeypress",
    "onkeyup",
    "onfocus",
    "onblur",
    "onchange",
    "oninput",
    "onselect",
    "onsubmit",
    "onreset",
    "oninvalid",
    "onsearch",
    "onload",
    "onunload",
    "onresize",
    "onscroll",
    "ononline",
    "onoffline",
    "ondrag",
    "ondragstart",
    "ondragend",
    "ondragenter",
    "ondragleave",
    "ondragover",
    "ondrop",
    "onanimationstart",
    "onanimationend",
    "onanimationiteration",
    "ontransitionstart",
    "ontransitionend",
    "ontransitionrun",
    "ontransitioncancel",
    "ontoggle",
    "onbeforetoggle",
  ],
};




/** Matches a single CSS `@property` block with its name and body. */
const propertyBlockRegex =
  /@property\s+(--[A-Za-z0-9-_]+)\s*\{([\s\S]*?)\}/g;

/** Decodes the `.-`/`-.` escapes back to `<`/`>` inside `@property` syntax values. */
export function decodePropertySyntax(css:string) {
  return css.replace(propertyBlockRegex, (full, name, body) => {
    const newBody = body.replace(
      /syntax:\s*(['"])(.*?)\1/g,
      // @ts-ignore
      (match, quote, content) => {
        const decoded = content
          .replace(/\.\-/g, "<")
          .replace(/\-\./g, ">");
        return `syntax: ${quote}${decoded}${quote}`;
      }
    );

    return `@property ${name} {${newBody}}`;
  });
}
/** Encodes `<`/`>` as `.-`/`-.` inside `@property` syntax values. */
export function encodePropertySyntax(css:string) {
  return css.replace(propertyBlockRegex, (full, name, body) => {
    const newBody = body.replace(
      /syntax:\s*(['"])(.*?)\1/g,
      // @ts-ignore
      (match, quote, content) => {
        const encoded = content
          .replace(/</g, ".-")
          .replace(/>/g, "-.");
        return `syntax: ${quote}${encoded}${quote}`;
      }
    );

    return `@property ${name} {${newBody}}`;
  });
}




/** Builds the evaluation context object passed into compiled expressions and the VM. */
export function createAdvectContext(el:AdvectElement){

  return {
    $$$refs: new Map<string, Record<string,Record<string, any>>>(),
    $$$locals: {} as Record<string,any>,
    $element: el,
    $refs: el.$refs,
    $attr: el.$attr,
    $state: el.$state,
    state: el.state,
    $internals: el.$internals,
  }
 
}

/**
 * Builds `let` declarations that destructure each context key from `objectName`.
 * @param context object whose keys become local bindings
 * @param objectName identifier the bindings read from
 * @param exclude keys to skip (eg. names the script declares itself)
 */
export function getScriptVars (context:Record<string | symbol, any>, objectName:string =  'context', exclude:string[] = []):string{
  return Object.keys(context)
      .filter((v) => !exclude.includes(v))
      .map((v) => {
        return `let ${v} = ${objectName}['${v}'];`;
      })
      .join("\n");
}