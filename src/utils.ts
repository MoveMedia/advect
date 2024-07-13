


/**
 * Reference to the window object without type checking
 */
export const $window = (window as (Record<string, any> & Window) ) ;

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

export function scriptFromUrl(url:string, type:string = "text/javascript", add = true, onLoad?: (event:Event) =>void) {
    const script = document.createElement('script');
    script.src = url;
    script.type = type;
    if (add) document.head.appendChild(script);
    if (onLoad) script.onload = onLoad;
    return script;
}
$window.scriptFromUrl = scriptFromUrl;

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
export const replaceAngles  = (str:string) => str.replace(/&lt;/g, '<').replace(/&gt;/g, '>');

export const dashedCase = (camel:string) => camel.replace(/[A-Z]/g, m => "-" + m.toLowerCase());


//const cssProps = Object.keys(document.body.style).map(dashedCase);
//console.log(cssProps);
/**
 * Async function constructor
 */
export const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
