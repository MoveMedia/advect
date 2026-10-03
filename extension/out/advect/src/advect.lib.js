"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvectSettings = exports.AsyncFunction = exports.AttrTypes = void 0;
exports.getDefaultElementSettings = getDefaultElementSettings;
exports.isValidAttrType = isValidAttrType;
exports.toModule = toModule;
exports.stripHtmlComments = stripHtmlComments;
exports.decodePropertySyntax = decodePropertySyntax;
exports.encodePropertySyntax = encodePropertySyntax;
exports.createAdvectContext = createAdvectContext;
exports.getScriptVars = getScriptVars;
exports.AttrTypes = {
    int: {
        parse: (val) => {
            try {
                return parseInt(val);
            }
            catch (e) {
                return null;
            }
        },
        store(val) {
            return `${val}`;
        },
    },
    float: {
        parse: (val) => {
            try {
                return parseFloat(val);
            }
            catch (e) {
                return null;
            }
        },
        store(val) {
            return `${val}`;
        },
    },
    string: {
        parse: (val) => {
            return val;
        },
        store(val) {
            return val;
        },
    },
    bigint: {
        parse: (val) => {
            try {
                return BigInt(val);
            }
            catch (e) {
                return null;
            }
        },
        store(val) {
            return `${val}`;
        },
    },
    color: {},
};
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
function getDefaultElementSettings() {
    return {
        tagName: "",
        module: "",
        root: "light",
        shadow: "closed",
        watched: {},
        logs: [],
        layout: null,
        style: "",
        loads: [],
    };
}
function isValidAttrType(attr) {
    return (Object.keys(exports.AttrTypes).find((t) => t.toLowerCase() == attr.toLowerCase()) !=
        null);
}
/**
 * Constructor for an async function.
 */
exports.AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
/**
 * Given a string creates a module
 * @param script the text of the module
 * @param inject strings to be added before the rest of the module script
 * @returns a module
 */
function toModule(script, inject) {
    const encoded_uri = "data:text/javascript;charset=utf-8," +
        inject.join("\n") +
        encodeURIComponent(`${script}`);
    return Promise.resolve(`${encoded_uri}`).then(s => require(s)).then((module) => module)
        .catch((err) => {
        console.error(err);
        return null;
    });
}
/**
 * Broadcast channel for console logs
 */
function stripHtmlComments(htmlString) {
    return htmlString.replace(/<!--[\s\S]*?-->/g, "");
}
exports.AdvectSettings = {
    data: {
        session_key: '$$$advect-loads'
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
        selfClosing: new Set([
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
const propertyBlockRegex = /@property\s+(--[A-Za-z0-9-_]+)\s*\{([\s\S]*?)\}/g;
function decodePropertySyntax(css) {
    return css.replace(propertyBlockRegex, (full, name, body) => {
        const newBody = body.replace(/syntax:\s*(['"])(.*?)\1/g, 
        // @ts-ignore
        (match, quote, content) => {
            const decoded = content
                .replace(/\.\-/g, "<")
                .replace(/\-\./g, ">");
            return `syntax: ${quote}${decoded}${quote}`;
        });
        return `@property ${name} {${newBody}}`;
    });
}
function encodePropertySyntax(css) {
    return css.replace(propertyBlockRegex, (full, name, body) => {
        const newBody = body.replace(/syntax:\s*(['"])(.*?)\1/g, 
        // @ts-ignore
        (match, quote, content) => {
            const encoded = content
                .replace(/</g, ".-")
                .replace(/>/g, "-.");
            return `syntax: ${quote}${encoded}${quote}`;
        });
        return `@property ${name} {${newBody}}`;
    });
}
function createAdvectContext(el) {
    return {
        $$$refs: new Map(),
        $$$locals: {},
        $element: el,
        $refs: el.$refs,
        $attr: el.$attr,
        $state: el.$state,
        state: el.state,
        $internals: el.$internals,
    };
}
function getScriptVars(context, objectName = 'context') {
    return Object.keys(context)
        .map((v) => {
        return `let ${v} = ${objectName}['${v}'];`;
    })
        .join("\n");
}
//# sourceMappingURL=advect.lib.js.map