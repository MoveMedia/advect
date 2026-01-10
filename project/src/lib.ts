import type { AdvectElement } from "./advect.element";
import type { HTMLNode } from "./advect.HTMLNode";

export type AttrTypeKey = keyof typeof AttrTypes;
export type AttrType = typeof AttrTypes;
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

export type FormatTypeKey = keyof typeof FormatTypes;
export type FormatType = typeof FormatTypes;
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
   * The JS module of the component
   * will be the first <script type="module"> with no "src" atttribute
   */
  module: string;
  /**
   * The markup for the component
   * Will be placed in the "light" dom by default controlled by the "root" attribute on the template tag
   */
  template: string;
  /**
   * Reference to the HTMLNode interface.
   * This can be used to reference the original component markup without needing access the the browser APIs
   */
  templateNode: HTMLNode | null;

  /**
   * Layout of the component
   */
  layout: string | null;

  layoutNodes: HTMLNode[];

  /**
   * References in the template.
   * all html elements with a "ref attribute"
   */

  refs: HTMLNode[];
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
   * Watched attributes are defined inside the
   * <settings>
   * <attr name="ting" type="string" />
   * </settings> tags
   * these are not added to the mark up
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

  loads: string[];
}

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

export type AvectVMProvider = () => AdvectVM;

export const AdvectSettings = {
  data:{
    session_key : '$$$advect-loads'
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
    template: "advect",
    props_prefix: "prop-",
    ref_key: "ref",
    directives: {
      forStatement: "adv-for",
      ifStatement: "adv-if",
      ofStatement: "adv-of",
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


export function getScriptVars (context:Record<string | symbol, any>, objectName:string =  'context'):string{
  return Object.keys(context)
      .map((v) => {
        return `let ${v} = ${objectName}['${v}'];`;
      })
      .join("\n");
}

const propertyBlockRegex =
  /@property\s+(--[A-Za-z0-9-_]+)\s*\{([\s\S]*?)\}/g;

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



export type AdvectContext = ReturnType<typeof createAdvectContext>;
export function createAdvectContext(el:AdvectElement){
  const context = {
    refs: new Map<string, HTMLNode>(),
    currentNode: null as HTMLNode | null,
    $element:el,
  }
;
  return new Proxy(context, {
    ownKeys: () => Object.keys(context),
  })
}