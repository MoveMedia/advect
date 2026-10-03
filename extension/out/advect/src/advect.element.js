"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvectElement = void 0;
exports.refHandle = refHandle;
const advect_lib_1 = require("./advect.lib");
// custom elements my not be defined or ready when you access them
// the same is not true for regular dom elements
// so lets wrap all of them
function refHandle(el) {
    return new Promise((resolve, reject) => {
        if (!el || !el.isConnected) {
            resolve(null);
            return;
        }
        const isCustom = el.tagName.indexOf("-") != -1;
        if (!isCustom) {
            resolve(el);
            return;
        }
        const isDefined = el.matches(":defined");
        if (!isDefined) {
            customElements
                .whenDefined(el.tagName)
                .then((_) => {
                resolve(el);
            })
                .catch((e) => {
                reject(e);
            });
        }
        resolve(el);
    });
}
/**
 * Base class for custom web elements
 */
class AdvectElement extends HTMLElement {
    $vm = null;
    get $style() {
        return this.$settings.style;
    }
    get $stylesheet() {
        // @ts-ignore
        return this.constructor.$stylesheet;
    }
    get $internals() {
        return this.#internals;
    }
    #internals;
    /**
     *
     */
    get $settings() {
        // @ts-ignore Assigned by componnet builder
        return this.constructor.$settings;
    }
    #shadow;
    get $shadow() {
        return this.#shadow;
    }
    get $domRoot() {
        const root = this.$settings.root === "shadow" ? this.#shadow : this;
        return root;
    }
    //#eta = createEta();
    #stateMap = new Map();
    get stateMap() {
        return this.#stateMap;
    }
    $state = new Proxy({}, {
        get: (_, key) => {
            return this.#stateMap.get(key);
        },
        set: (_, p, newValue) => {
            this.#stateMap.set(p, newValue);
            this.render();
            return true;
        },
        ownKeys: () => {
            return Array.from(this.#stateMap.keys());
        },
    });
    state = new Proxy({}, {
        get: (_, key) => {
            return this.#stateMap.get(key);
        },
        set: (_, p, newValue) => {
            this.#stateMap.set(p, newValue);
            return true;
        },
        ownKeys: () => {
            return Array.from(this.#stateMap.keys());
        },
    });
    //  onMutation = (_: MutationRecord[]) => {};
    //  onIntersect = (_: IntersectionObserverEntry[]) => {};
    /**
     * References
     */
    $refs = new Proxy({}, {
        get: (_, key) => {
            const ref = this.$domRoot.querySelector(`[ref="${key}"]`);
            return refHandle(ref);
        },
    });
    $attr = new Proxy({}, {
        get: (_, name) => {
            // if (!this.isConnected) return null;
            // if (this.$settings.watched[name as string]) {
            //   const type = AttrTypes[this.$settings.watched[name as string].type];
            //   const hasAttr = this.hasAttribute(name as string);
            //   if (this.hasAttribute(name as string)) {
            //     // @ts-ignore
            //     return type?.parse(this.getAttribute(name as string) ?? "") ?? null;
            //   } else {
            //     // @ts-ignore
            //     return (type?.parse(
            //         this.$settings.watched[name as string].defaultValue ?? ""
            //       ) ?? null
            //     );
            //   }
            // }
            return this.getAttribute(name);
        },
        set: (_, name, value) => {
            let newValue = value;
            let oldValue = this.getAttribute(name);
            // if (this.isConnected) {
            //if (this.$settings.watched[name as string]) {
            //  const type = AttrTypes[this.$settings.watched[name as string].type];
            // @ts-ignore
            //  newValue =type?.store(this.getAttribute(name as string) ?? "") ?? null;
            //}
            this.setAttribute(name, newValue);
            this.anyAttrChanged?.call(this, name, newValue, oldValue);
            this.render();
            return true;
            // }
            // return false;
        },
    });
    constructor() {
        super();
        this.#internals = this.attachInternals();
        this.render.bind(this);
        //this.hook.bind(this);
        // @ts-ignore also a little sussy
    }
    initVM() {
        // @ts-ignore
        this.$vm = this.constructor?.$advectVMProvider?.call(this, {
            $state: this.$state,
            state: this.state,
            $element: this,
            $refs: this.$refs,
            $attr: this.$attr,
            $internals: this.#internals,
            //   $dispose: dispose,
        });
    }
    anyAttrChanged = null;
    connectedCallback() {
        this.initVM();
        if (this.$settings.root == "shadow") {
            this.#shadow = this.attachShadow({ mode: this.$settings.shadow });
            this.#shadow.adoptedStyleSheets = [this.$stylesheet];
        }
        else {
            if (document.adoptedStyleSheets.indexOf(this.$stylesheet) == -1) {
                document.adoptedStyleSheets.push(this.$stylesheet);
            }
        }
        this.render();
        this?.$vm?.onConnect?.call(this);
    }
    connectedMoveCallback() {
        try {
            this.$vm?.onMove?.call(this);
        }
        catch (e) {
            console.warn(e);
        }
    }
    disconnectedCallback() {
        //this.#reactiveDispose();
        try {
            this?.$vm?.onDisconnect?.call(this);
        }
        catch (e) {
            console.warn(e);
        }
    }
    adoptedCallback() {
        try {
            this.$vm?.onAdopt?.call(this);
        }
        catch (e) {
            console.warn(e);
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        requestAnimationFrame(() => {
            this.$vm?.onWatchedAttrChanged?.call(this, name, newValue, oldValue);
        });
    }
    render() {
        if (this.$vm == null)
            return;
        const context = (0, advect_lib_1.createAdvectContext)(this);
        const hook = (ref) => {
            const refData = context.$$$refs.get(ref.getAttribute('ref') ?? '');
            if (!refData)
                return;
            const event_attrs = ref
                .getAttributeNames()
                .filter((name) => advect_lib_1.AdvectSettings.events.indexOf(name) != -1);
            const eventScript = (0, advect_lib_1.getScriptVars)(refData, '$$$refData');
            event_attrs.forEach((name) => {
                const attr_val = ref.getAttribute(name) ?? "";
                // @ts-expect-error assigning event handlers by name nothing to see here
                ref[name] = (_event) => {
                    new advect_lib_1.AsyncFunction("$$$context", "$$$refData", "$event", "$this", "$state", "state", "$attr", `${eventScript}; ${attr_val}`)(context, refData, _event, this, this.$state, this.state, this.$attr);
                };
            });
            Array.from(ref.attributes)
                .filter(a => !Object.hasOwn(advect_lib_1.AdvectSettings.attributes.directives, a.name) && advect_lib_1.AdvectSettings.events.indexOf(a.name) == -1)
                .forEach((a) => {
                if (a.value.startsWith("{") && a.value.endsWith("}")) {
                    const contextScript = (0, advect_lib_1.getScriptVars)(refData, '$$$refData');
                    const attrScript = a.value.substring(1, a.value.length - 1);
                    const finalScript = `${contextScript}; return ${attrScript}`;
                    const res = new Function("$$$context", "$$$refData", "ref", "$state", "state", "$attr", finalScript)(context, refData, ref, this.$state, this.state, this.$attr);
                    const boolAttr = advect_lib_1.AdvectSettings.attributes.booleans.find(att => att.toLocaleLowerCase() == a.name.toLocaleLowerCase());
                    if (boolAttr) {
                        if (!res) {
                            ref.attributes.removeNamedItem(a.name);
                        }
                        else {
                            ref.setAttribute(a.name, '');
                        }
                    }
                    else {
                        a.value = res;
                        ref.setAttribute(a.name, a.value);
                    }
                }
            });
            const exp = ref.innerHTML.matchAll(/\{\{(.*?)\}\}/g);
            exp.forEach((v) => {
                const contentScript = v[1].trim();
                const contextScript = (0, advect_lib_1.getScriptVars)(refData, '$$$refData');
                const finalScript = `${contextScript}\nreturn ${contentScript}`;
                const res = new Function("$$$context", '$$$refData', "ref", "$state", "state", "$attr", finalScript)(context, refData, ref, this.$state, this.state, this.$attr);
                ref.innerHTML = ref.innerHTML.replace(v[0], res);
            });
        };
        const cloneNode = this.$settings.layout?.cloneNode(true);
        const queue = [...Array.from(cloneNode.children)];
        while (queue.length > 0) {
            const el = queue.shift();
            const isHtmlElement = el instanceof HTMLElement;
            if (!isHtmlElement)
                continue;
            const refId = el?.getAttribute('ref') ?? '';
            const isRef = refId != null && refId.length > 0;
            const hasIfStatement = el?.hasAttribute('adv-if');
            const hasForStatement = el?.hasAttribute('adv-for');
            if (isRef) {
                context.$$$refs.set(refId, {});
            }
            let ifResult = true;
            if (hasIfStatement && isRef) {
                const ifStatement = el.getAttribute('adv-if') ?? '';
                const ifScript = `
        const state = $$$context.state;
        const $state = $$$context.$state;
        const $element = $$$context.$element;
        const $refs = $$$context.$refs;
        const $attr = $$$context.$attr;
        return ${ifStatement}};
        `;
                const ifFunction = new Function(ifScript);
                ifResult = ifFunction.call(this, context);
            }
            if (!ifResult)
                continue;
            if (hasForStatement && isRef) {
                const forStatement = el.getAttribute('adv-for');
                el.removeAttribute('adv-for');
                if (!forStatement)
                    continue;
                const split = forStatement?.split('of') ?? [];
                const arrayName = split.at(-1);
                const dataName = split.at(0)?.indexOf(',') != -1
                    ? split.at(0)?.split(',')[0].trim()
                    : split.at(0)?.trim();
                const indexName = split.at(0)?.indexOf(',') != -1
                    ? split.at(0)?.split(',')[1].trim()
                    : '';
                const nodeDestination = el.parentElement;
                nodeDestination?.removeChild(el);
                context.$$$refs.delete(refId);
                const forClone = el.cloneNode(true);
                const forScript = `
        const state = $$$context.state;
        const $state = $$$context.$state;
        const $element = $$$context.$element;
        const $refs = $$$context.$refs;
        const $attr = $$$context.$attr;
        for(let ${indexName} = 0; ${indexName} < ${arrayName}.length; ${indexName}++){
          const ${dataName} = ${arrayName}[${indexName}];
          const $$$newNode = $$$forClone.cloneNode(true);
          const $$$newRefId = '${refId}_' + ${indexName};
          $$$newNode.setAttribute('ref', $$$newRefId);
          const newLocals = {...$$$context.$$$locals, ${indexName},${dataName}}
          $$$context.$$$locals = newLocals;
          $$$context.$$$refs.set($$$newRefId, newLocals);
          $$$queue.push(...Array.from($$$newNode.children));
          $$$nodeDestination.appendChild($$$newNode);
          $$$hook($$$newNode);
        
        }`;
                const forFunction = new Function("$$$context", "$$$nodeDestination", "$$$forClone", '$$$queue', '$$$hook', forScript);
                forFunction.call(this, context, nodeDestination, forClone, queue, hook);
            }
            if (isRef)
                hook(el);
            if (!hasForStatement)
                queue.push(...(Array.from(el.children)));
        }
        while (this.$domRoot.firstChild) {
            this.$domRoot.removeChild(this.$domRoot.firstChild);
        }
        this.$domRoot.appendChild(cloneNode);
    }
    module(url, cb) {
        const _urls = Array.isArray(url) ? url : [url];
        const results = Promise.all(_urls.map(async (u) => {
            return await Promise.resolve(`${u}`).then(s => require(s));
        }));
        results.then((modules) => {
            cb.call(this, modules);
        });
    }
}
exports.AdvectElement = AdvectElement;
//# sourceMappingURL=advect.element.js.map