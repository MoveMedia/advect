import Advect from "./advect";
import { AdvectView } from "./AdvectView";



/**
 * Reference to the window object without type checking
 */
export const $window = (window as (Record<string, any> & Window & {
    adv_settings?: Record<string, any>;
    advect?: Advect
}));

/**
 * Creates a module from a string and imports it as a module returing the module
 * @param script script to convert to a module
 * @param inject lines to add to the script before parseing
 * @returns promise the module
 * @warning this function is NOT safe as it allows arbitrary code to be executed with module scope
 * please for the love of which ever creator you believe in set a CSP policy!
 */
export function toModule(script:string, inject:string[] = []) {
    const encoded_uri = 'data:text/javascript;charset=utf-8,' +
        inject.join('\n')
        + encodeURIComponent(`${script}`);
    return import( /* @vite-ignore */ encoded_uri)
        .then(module => module)
        .catch(err => { console.error(err); return null });
}

$window.scriptFromUrl = scriptFromUrl;
export function scriptFromUrl(url:string, type:string = "text/javascript", add = true, onLoad?: (event:Event) =>void) {
    const script = document.createElement('script');
    script.src = url;
    script.type = type;
    if (add) document.head.appendChild(script);
    if (onLoad) script.onload = onLoad;
    return script;
}

/**
 * Eh im not to dogmatic about havins scripts with exports and side effects
 */

/**
 * Creates a style element from a string of css and appends it to the head
 * (NOT IN USE)
 * @param css css to append
 * @returns the style element
 */
export function toStyle(cssStr:string) {
    const css = new CSSStyleSheet();
    css.replaceSync(cssStr);
    return css;
}


export type AConstructor<T = {}> = new (...args: any[]) => T;  


/**
 * Async function constructor
 */
export const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;


export type RenderDescriptor = {
    template: string;
    ctx?: Record<string, any>;
    view?: AdvectView;
    options?: Record<string, any>;
}
export type AdvectRenderFunction = (desc:RenderDescriptor) => string;