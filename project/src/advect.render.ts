import type { EtaConfig } from "eta";

/**
 * Wraps ETAjs  If / For
 * @param template 
 * @param etaConf 
 * @returns 
 */
export function cleanTemplate(template:string, etaConf:EtaConfig) {
    const [s, e] = etaConf.tags;
    const r = etaConf.parse.exec;
    const unescaped = convertEscapedChars(template);
    const _if = convertIfElse(unescaped);
    const _for = convertFor(_if);
    const _of = convertOf(_for);

    function convertEscapedChars(template:string) {
        return template
            .replace(/&gt;/g, ">")
            .replace(/&lt;/g, "<")
            .replace(/&amp;/g, "&");
    }
    
    function convertIfElse(template:string) {
        return template
            .replace(/<if check="([^"]+)">/g, `${s}${r} if ( $1 ) { ${e}`)
            .replace(/<else\/?>/g, `${s}${r} } else { ${e}`)
            .replace(/<\/if>/g, `${s}${r} } ${e}`);
    }
    
    
    function convertFor(template:string) {
        return template
            .replace(
                /<for data="([^"]+)"(?: name="([^"]+)")?(?: index="([^"]+)")?>/g,
                function (_, data, name, index) {
                    if (name && index) {
                        return `${s}${r} ${data}.forEach(function(${name}, ${index}){ ${e}`;
                    } else if (name) {
                        return `${s}${r} ${data}.forEach(function(${name}){ ${e}`;
                    } else {
                        return `${s}${r} ${data}.forEach(function(){ ${e}`;
                    }
                }
            )
            .replace(/<\/for>/g, `${s}${r} }) ${e}`);
    }
    
    
    function convertOf(template:string) {
        return template
            .replace(
                /<of data="([^"]+)"(?: name="([^"]+)")?(?: value="([^"]+)")?>/g,
                function (_, data, name, value) {
                    if (name && value) {
                        return `${s}${r} Object.keys(${data}).forEach(function(${name}) { ${e} 
                        ${s}${r} const ${value} = ${data}[${name}] ${e}
                    `;
                    } else if (name) {
                        return `${s}${r} Object.keys(${data}).forEach(function(${name}) { ${e}`;
                    } else {
                        return `${s}${r} Object.keys(${data}).forEach(function() { ${e}`;
                    }
                }
            )
            .replace(/<\/of>/g, `${s}${r} }) ${e}`);
    }
    
    return _of;
}

