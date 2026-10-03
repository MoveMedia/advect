"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExtensionSettings = createExtensionSettings;
exports.createHtmlCustomAttribute = createHtmlCustomAttribute;
exports.createHtmlCustomDataTag = createHtmlCustomDataTag;
exports.getCustomHtmlData = getCustomHtmlData;
exports.CWEtoTag = CWEtoTag;
function createExtensionSettings() {
    return {
        'component-dirs': []
    };
}
function createHtmlCustomAttribute(name, description, values = []) {
    return {
        name,
        description,
        values
    };
}
function createHtmlCustomDataTag(name, description, attributes) {
    return {
        name,
        description,
        attributes
    };
}
function getCustomHtmlData() {
    return {
        tags: [],
        globalAttributes: [],
        valueSets: []
    };
}
function CWEtoTag(cwe) {
    const cwes = Array.isArray(cwe) ? cwe : [cwe];
    const results = cwes.map(cwe => {
        return {
            name: cwe.tagName,
            description: cwe.tagName,
            attributes: []
        };
    });
    return results;
}
//# sourceMappingURL=lib.js.map