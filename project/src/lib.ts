import { type HTMLNodeInterface } from "./HTMLNode";

export type AttrTypeKey = keyof typeof AttrTypes;
export type AttrType = typeof AttrTypes;
const AttrTypes = {
  number: {},
  string: {},
  bigint: {},
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
  templateNode: HTMLNodeInterface | null;
  /**
   * References in the template.
   * all html elements with a "ref attribute"
   */
  refs: HTMLNodeInterface[];
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
  watched_attrs: {
    [key: string]: {
      type: AttrTypeKey;
      // format?: FormatType
      // storage: 'css-var' | 'store'
    };
  };
  /**
   * Mutation observer settings set inside
   * <setting>
   * </setting>
   */
  mutation?: {
    attributes?: boolean;
    characterData?: boolean;
    childList?: boolean;
    subtree?: boolean;
    attributeFilter?: string[];
  };
  intersection: {
    margin?: number;
    threshhold?: number;
    root?: string;
  };
  logs: string[];
}

export function isValidAttrType(attr: string) {
  return (
    Object.keys(AttrTypes).find(
      (t) => t.toLowerCase() == attr.toLocaleLowerCase()
    ) != null
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
export const adv_log_channel = new BroadcastChannel("advect:log");
adv_log_channel.onmessage = (event) => adv_msg(event);

function adv_msg(msg: MessageEvent) {
  switch (msg.data?.___type) {
    case "table":
      console.table(msg.data);
      break;
    case "dir":
      console.dir(msg.data);
      break;
    case "error":
      console.error(msg.data);
      break;
    case "warn":
      console.warn(msg.data);
      break;
    default:
    case "log":
      console.log(msg.data);
      break;
  }
}
/**
 * Logs from anywhere
 * @param msg 
 */
export function adv_log(msg: any) {
  adv_log_channel.postMessage({ ...msg, ___type: "log" });
}
export function adv_warn(msg: any) {
  adv_log_channel.postMessage({ ...msg, ___type: "warn" });
}
export function adv_error(msg: any) {
  adv_log_channel.postMessage({ ...msg, ___type: "error" });
}
export function adv_dir(msg: any) {
  adv_log_channel.postMessage({ ...msg, ___type: "dir" });
}
export function adv_table(msg: any) {
  adv_log_channel.postMessage({ ...msg, ___type: "table" });
}


