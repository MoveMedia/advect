"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomElementClasses = exports.cweFromTemplate = exports.cweSettingsFromString = exports.cweSettingsFromDoc = void 0;
exports.getAllComponents = getAllComponents;
const advect_lib_1 = require("./advect.lib");
const advect_element_1 = require("./advect.element");
const loaded = new Set();
const components = new Map();
function getAllComponents() {
    return components;
}
// @ts-ignore
window.advectGetComponents = getAllComponents;
const cweSettingsFromDoc = (doc) => {
    if (!doc)
        return [];
    const settings = [];
    const templates = Array.from(doc.querySelectorAll(`template[${advect_lib_1.AdvectSettings.attributes.template}]`));
    for (let template of templates) {
        const content = template.content.cloneNode(true);
        const setting = (0, advect_lib_1.getDefaultElementSettings)();
        setting.tagName = template.getAttribute(advect_lib_1.AdvectSettings.attributes.template) ?? "";
        if (template.hasAttribute('root')) {
            setting.root = template.getAttribute('root');
        }
        if (template.hasAttribute('shadow')) {
            setting.shadow = template.getAttribute('shadow');
        }
        for (const rootChild of Array.from(content.children)) {
            if (rootChild.nodeName == 'LAYOUT') {
                setting.layout = rootChild.cloneNode(true);
            }
            if (rootChild.nodeName == 'DATALIST') {
                Array.from(rootChild.children)
                    .map((child) => {
                    if (child.nodeName == 'OPTION') {
                        return {
                            name: child.getAttribute('name'),
                            type: child.getAttribute('type'),
                        };
                    }
                }).filter(v => v?.name)
                    .forEach(v => {
                    setting.watched[v?.name ?? ''] = {
                        type: (v?.type ?? 'string'),
                    };
                });
            }
            if (rootChild.nodeName == 'SCRIPT' && rootChild.getAttribute('type') == 'module') {
                setting.module = rootChild.textContent ?? '';
            }
            if (rootChild.nodeName == 'SCRIPT' && rootChild.getAttribute('rel')) {
                setting.loads.push(rootChild.getAttribute('rel') ?? '');
            }
            if (rootChild.nodeName == 'STYLE') {
                setting.style = rootChild.textContent ?? '';
            }
        }
        settings.push(setting);
    }
    return settings;
};
exports.cweSettingsFromDoc = cweSettingsFromDoc;
const cweSettingsFromString = (htmlString) => {
    try {
        const docParser = new DOMParser();
        const doc = docParser.parseFromString(htmlString, "text/html");
        return (0, exports.cweSettingsFromDoc)(doc);
    }
    catch (e) {
        console.error(e);
        return [];
    }
};
exports.cweSettingsFromString = cweSettingsFromString;
const cweFromTemplate = (template) => {
    return (0, exports.cweSettingsFromString)(template.outerHTML);
};
exports.cweFromTemplate = cweFromTemplate;
const createCustomElementClasses = (buildSettings, register = true) => {
    const buildClasses = [];
    // todo try here
    for (let settings of buildSettings) {
        components.set(settings.tagName, settings);
        // for some reason ts thinks settings is used before being declared so let's add a pointer
        const $settings = settings;
        if (customElements.get($settings.tagName)) {
            console.warn(`Already registered ${$settings.tagName}`);
            continue;
        }
        (0, advect_lib_1.toModule)(settings.module, []).then((module) => {
            // TODO fix change to module default
            //const moduleClass = module[moduleClassName];
            const stylesheet = new CSSStyleSheet();
            stylesheet.replace((0, advect_lib_1.decodePropertySyntax)($settings.style));
            const newClass = class extends advect_element_1.AdvectElement {
                static observedAttributes = Object.keys($settings.watched);
                static $settings = $settings;
                static $stylesheet = stylesheet;
                static $advectVMProvider = module?.default;
                connectedCallback() {
                    super.connectedCallback();
                }
            };
            if (register &&
                $settings.tagName.length >= 3 &&
                $settings.tagName.indexOf("-") &&
                customElements.get($settings.tagName) === undefined) {
                customElements.define($settings.tagName, newClass);
            }
            buildClasses.push(newClass);
        });
    }
    const newLoads = buildSettings.map(bs => bs.loads).flat();
    if (newLoads.length > 0) {
        cweFromUrls(newLoads).then(s => {
            (0, exports.createCustomElementClasses)(s, true);
        });
    }
    return buildClasses;
};
exports.createCustomElementClasses = createCustomElementClasses;
const cweFromUrls = async (urls) => {
    const settingResults = [];
    const _urls = [];
    if (Array.isArray(urls)) {
        _urls.push(...urls);
    }
    if (typeof urls == "string") {
        _urls.push(urls);
    }
    const results = await Promise.all(_urls.filter(u => !loaded.has(u)).map((url) => fetch(url)
        .then((r) => r.text())
        .then(t => (0, exports.cweSettingsFromString)(t)))).then(r => r.flat());
    settingResults.push(...results);
    _urls.forEach(u => {
        loaded.add(u);
    });
    return settingResults;
};
const onContent = (_) => {
    const settingsFromTemplates = Array.from(document
        .querySelectorAll(`template[${advect_lib_1.AdvectSettings.attributes.template}]`))
        .map((template) => (0, exports.cweFromTemplate)(template)).flat();
    (0, exports.createCustomElementClasses)(settingsFromTemplates);
    let settingsFromUrls = Array.from(document.querySelectorAll("script[rel]"))
        .map((script) => script.getAttribute("rel") ?? "")
        .filter(v => v.length > 0);
    cweFromUrls(settingsFromUrls).then(s => {
        (0, exports.createCustomElementClasses)(s);
    });
    document.removeEventListener("DOMContentLoaded", onContent);
};
if (document.readyState !== "loading") {
    onContent(null);
}
else {
    document.addEventListener("DOMContentLoaded", onContent);
}
//# sourceMappingURL=advect.js.map