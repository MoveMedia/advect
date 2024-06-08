
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
    return import(encoded_uri)
        .then(module => module)
        .catch(err => { console.error(err); return null });
}

/**
 * Creates a style element from a string of css and appends it to the head
 * @param css css to append
 * @returns the style element
 */
export function toStyles(css:string) {
    const style = document.createElement('style');
    style.textContent = css;
  //  document.head.appendChild(style);
    return style;
}

export const $window = (window as any);

export const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;