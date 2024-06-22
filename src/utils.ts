
/**
 * Creates a module from a string and imports it as a module returing the module
 * @param script script to convert to a module
 * @param inject lines to add to the script before parseing
 * @returns promise the module
 */
export function toModule(script:string, inject:string[] = []) {
    const encoded_uri = 'data:text/javascript;charset=utf-8,' +
        inject.join('\n')
        + encodeURIComponent(`${script}`);
    return import( /* @vite-ignore */ encoded_uri)
        .then(module => module)
        .catch(err => { console.error(err); return null });
}

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
/**
 * Reference to the window object without type checking
 */
export const $window = (window as (Record<string, any> & Window) ) ;


/**
 * Async function constructor
 */
export const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;


