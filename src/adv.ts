import * as domhandler from "domhandler";
import { Parser } from "htmlparser2";
import { createStore } from "zustand/vanilla"


export interface AdvectPlugin {
    name: string;
    version: string;
    description: string;
    install: (adv: typeof $adv) => void;
}

interface AdvParsedTemplate {
    template: domhandler.Element;
    import_scripts: domhandler.Element[];
    inline_scripts: domhandler.Element[];
    inline_styles: domhandler.Element[];
    ref_nodes: domhandler.Element[];
    markup_roots: domhandler.Element[];
}

type Constructor<T> = {
    new(...args: any[]): T;
}

type $BaseClass = Constructor<HTMLElement>;

const $window = window as Window as any;

export interface DocumentDataRef<T> {
    id: string;
    type: DocumentDataType<T>;
    value?: T;
}

export type AttributeDescription = {
    name: string;
    type: string;
};

export type DocumentDataValidator<T> = (value: string) => {
    isValid: boolean;
    hasValue: boolean;
    parsedValue: T | null;
    error?: string
};

export interface DocumentDataType<T> {
    name: string;
    default: T;
    validator: DocumentDataValidator<T>;
    description: string;
}

const script_type = "text/adv";
const attr_name = "adv";
const ignored_attrs: string[] = [
    'adv',
    'shadow',
    'attachInternals',
];
const processed_events = Object.keys(HTMLElement.prototype).filter((name) => name.startsWith("on"));

const types = new Map<string, DocumentDataType<any>>();
types.set("string", {
    default: "",
    name: "string",
    description: "A string of characters",
    validator: (val: string) => {
        return {
            isValid: true,
            hasValue: val ? true : false,
            parsedValue: val
        }
    },
}).set("number", {
    default: 0,
    name: "number",
    description: "A number",
    validator: (val: string) => {
        const parsedValue = Number(val);
        const isValid = !Number.isNaN(parsedValue);
        return {
            isValid,
            hasValue: val ? true : false,
            parsedValue
        }
    },
}).set("boolean", {
    default: false,
    name: "boolean",
    description: "A boolean value",
    validator: (val: string) => {
        const isValid =
            val === "true" ||
            val === "false" ||
            val === "1" ||
            val === "0" ||
            false;

        const parsedValue = val === "true" || val === "1"
        return {
            isValid,
            hasValue: val ? true : false,
            parsedValue,
        };
    },
}).set("bigint", {
    default: 0n,
    name: "bigint",
    description: "A big integer",
    validator: (val: string) => {
        const parsedValue = BigInt(val);
        const isValid = !Number.isNaN(parsedValue);
        return {
            isValid,
            hasValue: val ? true : false,
            parsedValue
        }
    },
}).set("json", {
    default: null,
    name: "json",
    description: "A JSON object",
    validator: (val: string) => {
        let parsedValue;
        try {
            parsedValue = JSON.parse(val);
        }
        catch (e) {
            console.error(e);
        }
        const isValid = parsedValue instanceof Object;
        return {
            isValid,
            hasValue: val ? true : false,
            parsedValue,
        };
    }
});


type DocumentDataStore = {
    attrs: Map<string, AttributeDescription>;
    attr(el: HTMLElement, propDesc: Record<string, string>): HTMLElement;
    plugins: Map<string, any>;
    plugin(name: string, plugin: any): void;
    values: Map<string, { id: string, type: string, value: any }>;
    value(element: HTMLElement, typeName: string, initialVal?: string): void;
    types: Map<string, DocumentDataType<any>>;
    type<T>(name: string, default_value: T, validator: DocumentDataValidator<T>, description: string): void;
    script_type: string;
    attr_name: string;
    ignored_attrs: string[];
    // list id the template id
    loaded_templates: [];
    processed_events: string[];
    generate: (pt: AdvParsedTemplate) => Promise<Constructor<HTMLElement>>;
    parse: (src: string) => Promise<AdvParsedTemplate[]>;
}


const $adv = createStore<DocumentDataStore>((set, get) => ({
    processed_events,
    loaded_templates: [],
    script_type,
    attr_name,
    ignored_attrs,
    plugins: new Map<string, AdvectPlugin>(),
    plugin(name: string, plugin: any) {
        const state = get();
        state.plugins.set(name, plugin);
        set({ plugins: state.plugins });
    },
    values: new Map<string, { id: string, type: string, value: any }>(),
    // This element has a .value that can be set and get and validated
    value(element: HTMLElement, typeName: string, initialVal?: string) {
        const type = types.get(typeName);
        if (element.id === "") {
            console.warn("Element does not have an id", element, typeName);
            return;
        }

        if (!type) {
            console.warn(`Unknown type: ${typeName}`);
            return null;
        }
        if (element.hasOwnProperty('value')) {
            return new Proxy(element, {

            });

        } else {
            // everything else
            return new Proxy(element, {

            });
        }
    },
    types,
    // This is a type that can be used to validate and parse values
    type<T>(name: string, default_value: T, validator: DocumentDataValidator<T>, description: string) {
        const state = get();
        const existingType = state.types.get(name);
        if (existingType) {
            console.warn(`Type ${name} already exists`);
            return false;
        }
        state.types.set(name, { name, default: default_value, validator, description });
        set({ types: state.types });
        return true
    },
    // This element has a .attr that can be set and get and validated
    attrs: new Map<string, AttributeDescription>(),
    attr(el: HTMLElement, propDesc: Record<string, string>) {
        const state = get();
        // maybe we dont need the proxy list
        const attrProxyRegistry: Record<string, Attr> = {};

        const getProxy = (attribute: Attr, targetProp: string) => {
            // console.log("Getting proxy", attribute.name);
            // if the attribute is in the registry return it
            if (
                Object.keys(attrProxyRegistry).indexOf(attribute.name.toLowerCase()) !==
                -1
            ) {
                return attrProxyRegistry[attribute.name.toLowerCase()];
            }
            const type = propDesc[attribute.name.toLowerCase()];
            const typeHandler = state.types.get(type);

            const attrProxy = new Proxy(attribute, {
                get(target, prop, _receiver) {
                    if (prop === "value" && typeHandler) {
                        return typeHandler.validator(target.value).parsedValue;
                    }
                    return attribute.value;
                },
                set(_target, prop, value) {
                    if (prop === "value" && typeHandler) {
                        const { isValid, parsedValue } = typeHandler?.validator(value);
                        if (isValid) {
                            //  console.log("Setting value", parsedValue);
                            el.setAttribute(targetProp, parsedValue);
                            return true;
                        } else {
                            console.error(`Invalid value for ${prop}, on ${el.id}`);
                            return false;
                        }
                    }

                    // @ts-expect-error
                    return Reflect.set(...arguments);
                },
            });

            attrProxyRegistry[attribute.name.toLowerCase()] = attrProxy;

            return attrProxy;
        };
        // proxy on the list of attributes
        const attrListProxy = new Proxy(el.attributes, {
            get(_target, prop, _receiver) {
                if (typeof prop === 'string' && Object.keys(propDesc).indexOf(prop.toLowerCase()) !== -1) {
                    // @ts-expect-error
                    return getProxy(Reflect.get(...arguments), prop);
                }
                // @ts-expect-error
                return Reflect.get(...arguments);
            },
        });


        return new Proxy(el, {
            get(target, prop, _receiver) {
                if (prop === "attr") {
                    return attrListProxy;
                }
                return Reflect.get(target, prop, _receiver);
            },
        });

    },
    generate: async (pt: AdvParsedTemplate) => {

        const state = get();

        const { template: $template, import_scripts, inline_scripts, inline_styles, ref_nodes, markup_roots } = pt;

        const $baseClassName = $template.attribs.adv ?? 'HTMLElement';
        const component_tag = $template.attribs.id;
        const watch_attr = $template.attribs;
        const shadow = $template.attribs['shadow'];

        const _class = class extends ($window[$baseClassName] as $BaseClass ?? HTMLElement) {
            static #ic = -1;
            static get observedAttributes() {
                return $template.attributes.map(a => a.name)
                    .filter((n) => state.ignored_attrs.indexOf(n.toLowerCase()) === -1);
            }

            refs: Record<string, Node> = {};
            // @ts-ignore
            #originalContent!: HTMLElement;

            get signature() {
                return `${$template.attribs.id}-${this.ic}`;
            }
            attrChanged: (name: string, oldValue: string, newValue: string) =>
                void = (_name: string, _oldValue: string, _newValue: string) => { };

            attributeChangedCallback(name: string, oldValue: string, newValue: string) {
                this?.attrChanged(name, oldValue, newValue);
                this.#validateAttrs();
            }

            get root(): ShadowRoot | HTMLElement {
                return $template.attribs.shadow ? this.shadowRoot as ShadowRoot : this;
            }

            constructor() {
                super();
                (this.constructor as typeof _class).#ic++;
            }

            get ic() {
                return (this.constructor as typeof _class).#ic;
            }

            connectedCallback() {
                // cant be set until the element is connected
                //  this.#attr = $adv.attr(this,(this.constructor as typeof _class).#ATTR_DESC);

                this.#originalContent = this.cloneNode(true) as HTMLElement;

                if ($template.attribs.shadow && $template.attribs.shadow === "open") {
                    this.attachShadow({ mode: "open" });
                    if (this.shadowRoot) {
                        this.shadowRoot.innerHTML = $template.children.map((c) => c.toString()).join("");;
                    }
                } else {
                    this.innerHTML = $template.children.map((c) => c.toString()).join("");
                }
                this.id = `${$template.attribs.id}-${this.ic}`;

                // this.#evalSlots();
                // Refs need to come first so that $ref works in inline scripts
                this.#buildRefs();
                this.#evalScripts();

                this.#evalStyles();
                this.#validateAttrs();
            }
            // remove(): void {
            //   super.remove();
            //   try {
            //     const parent = document.getElementById(this.id)?.parentElement
            //     if (parent) {
            //       parent.removeChild(this);
            //       console.log("removed", this.id);
            //     }
            //   } catch (e) {
            //   }
            // }

            disconnectedCallback() {
                // console.log("disconnected");
                this?.diconnected();
            }
            diconnected = () => { };

            #buildRefs() {
                // these guys are special

                const els = [
                    ...this.root.querySelectorAll(
                        "[id]"
                    ),
                ];

                console.log(els)
                els.forEach((el) => {
                    // change the id so that it is unique across all instances
                    const og_id = el.id;

                    requestAnimationFrame(() => {
                        el.id = `${this.signature}-${el.id}`;
                    });
                    // Weakref these maybe
                    // set global refsf
                   // $adv.refs.set(el.id, el);
                    // set local refs
                    this.refs[og_id] = el;
                });
            }
            async #evalScripts() {
                // need at one list to hook up the events
                const scripts = [...this.root.querySelectorAll("script")];

                const $self = this;

                console.log("Scripts", scripts);
                // all scripts out put are merged into one scope
                let $scope = {};
                for (let s of scripts) {
                    try {
                        (await async function () {
                            const _$scope = await eval(
                                "(async function(){" + s.textContent + "})()"
                            );
                            if (_$scope && _$scope.constructor.name === "AsyncFunction") {
                                const __$scope = await _$scope();
                                $scope = { ...$scope, ...__$scope };
                            }
                            if (
                                _$scope instanceof Function &&
                                !(_$scope instanceof Promise)
                            ) {
                                const __$scope = _$scope();
                                $scope = { ...$scope, ...__$scope };
                            }
                            if (_$scope) {
                                $scope = { ...$scope, ..._$scope };
                            }
                        }).call({ $self, $template, $modules: $adv.modules });
                    } catch (e) {
                        console.error(e);
                    }
                }
                console.log("Scope", $scope);
                console.log("Refs", this.refs);
                Object.values(this.refs).forEach((refEl) => {
                    $window.$adv.hook(refEl, $self, $template, $scope, $adv.modules);
                });
            }

            #evalStyles() {
                //const styles = [...this.querySelectorAll("style")];
            }
            #validateAttrs() {
                const state = get();
                Object.keys($template.attribs).forEach((prop) => {
                    const type = $template.attribs[prop];
                    const typeHandler = state.types.get(type);
                    const attr = this.getAttribute(prop) ?? '';
                    if (typeHandler){
                        const { isValid, hasValue } = typeHandler?.validator(attr);
                        if (!isValid && hasValue) {
                            console.error(`Invalid value "${attr}" for ${prop}, on ${this.id}`);
                        }
                    }
                });
            }
        }

        return _class;

    },
    parse: async (src: string) => {
        const templateDatas: AdvParsedTemplate[] = [];
        const handler = new domhandler.DomHandler((error, dom) => {
            if (!error) {
                //console.log(dom);
                dom.forEach((element) => {
                    if (element.type === 'tag' && element.name === 'template') {
                        const templateData: AdvParsedTemplate = { template: element, markup_roots: [], import_scripts: [], inline_scripts: [], inline_styles: [], ref_nodes: [] }
                        element.children.forEach((child) => {
                            switch (child.type) {
                                case 'text':
                                    break;
                                case 'style':
                                    if (child.attribs.src) {
                                        //import_styles.push(child);
                                    } else {
                                        templateData.inline_styles.push(child);
                                    }
                                    break;
                                case 'script':
                                    if (child.attribs.src) {
                                        templateData.import_scripts.push(child);
                                    } else {
                                        templateData.inline_scripts.push(child);
                                    }
                                    break;
                                case 'tag':
                                    templateData.markup_roots.push(child);
                                    break;
                                default:
                                    break;
                            }
                        });

                        const search_nodes: domhandler.ChildNode[] = templateData.markup_roots;
                        // Nodes with Ids
                        const ref_nodes: domhandler.Element[] = [];

                        while (search_nodes.length > 0) {
                            const node = search_nodes.pop();
                            if (!node || node.type != 'tag') continue;
                            if (node.attribs.id) {
                                ref_nodes.push(node);
                            }
                            if (node.children) {
                                search_nodes.push(...node.children);
                            }
                        }
                        templateDatas.push(templateData);
                    }


                });

            } else {
                console.error(error);
            }
        });
        const parser = new Parser(handler);
        parser.write(src);
        parser.end();
        return templateDatas
    }

}));




