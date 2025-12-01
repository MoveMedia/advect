import type { HTMLNode } from "./advect.HTMLNode";

export type AttrTypeKey = keyof typeof AttrTypes;
export type AttrType = typeof AttrTypes;
export const AttrTypes = {
  int: {
    parse: (val:string) =>{
      try {
        return parseInt(val);
      }catch(e){
        return null
      }
    },
    store(val:number){
      return `${val}}`;
    }
  },
  float:{
    parse: (val:string) =>{
      try {
        return parseFloat(val);
      }catch(e){
        return null
      }
    },
    store(val:number){
      return `${val}}`;
    }
  },
  string: {
    parse: (val:string) =>{
      return val;
    },
    store(val:number){
      return val;
    }
  },
  bigint: {
    parse: (val:string) =>{
      try {
        return BigInt(val);
      }catch(e){
        return null
      }
    },
    store(val:number){
      return `${val}}`;
    }
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
  layout: string | null

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
  watched_attrs: {
    [key: string]: {
      type: AttrTypeKey;
      // format?: FormatType
      // storage: 'css-var' | 'store'
    };
  };

  props: {
    [key: string]: AttrTypeKey;
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
export const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

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

export function stripHtmlComments(htmlString:string) {
  return htmlString.replace(/<!--[\s\S]*?-->/g, '');
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

/**
 * Onload natively works for these 
 */
export const onloadElements = [
  "body",
  "iframe",
  "img",
  "link",
  "object",
  "script",
  "style",
  "audio",
  "video"
];

export interface AdvectVM {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onAttrChange?: (name: string, value: string, oldValue: string) => void;
}

export type AvectVMProvider = () => AdvectVM;


export function getEventMap (): Map<string,string> {
  return new Map([
    ["onclick", "click"],
    ["ondblclick", "dblclick"],
    ["onmousedown", "mousedown"],
    ["onmouseup", "mouseup"],
    ["onmousemove", "mousemove"],
    ["onmouseover", "mouseover"],
    ["onmouseout", "mouseout"],
    ["oncontextmenu", "contextmenu"],
    ["onwheel", "wheel"],
    ["onkeydown", "keydown"],
    ["onkeypress", "keypress"],
    ["onkeyup", "keyup"],
    ["onfocus", "focus"],
    ["onblur", "blur"],
    ["onchange", "change"],
    ["oninput", "input"],
    ["onselect", "select"],
    ["onsubmit", "submit"],
    ["onreset", "reset"],
    ["oninvalid", "invalid"],
    ["onsearch", "search"],
    ["onload", "load"],
    ["onunload", "unload"],
    ["onresize", "resize"],
    ["onscroll", "scroll"],
    ["ononline", "online"],
    ["onoffline", "offline"],
    ["ondrag", "drag"],
    ["ondragstart", "dragstart"],
    ["ondragend", "dragend"],
    ["ondragenter", "dragenter"],
    ["ondragleave", "dragleave"],
    ["ondragover", "dragover"],
    ["ondrop", "drop"],
    ["onanimationstart", "animationstart"],
    ["onanimationend", "animationend"],
    ["onanimationiteration", "animationiteration"],
    ["ontransitionstart", "transitionstart"],
    ["ontransitionend", "transitionend"],
    ["ontransitionrun", "transitionrun"],
    ["ontransitioncancel", "transitioncancel"],
  ]);
}


export function getBooleanHtmlTags (){
  return [
    'checked',
    'disabled',
    'readonly',
    'popover'
  ]
}


export const advect_keys = {
  settings: 'settings',
  attrs: 'attr',
  props: 'props',
  template_attr: 'advect'

}