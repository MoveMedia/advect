import settings from "./settings";
import { AsyncFunction } from "./utils";

export default class AdvectBase extends HTMLElement {
    #internals: ElementInternals;

    /**
     * getter for the shadowRoot or the element itself
     */
    get root(): ShadowRoot | this { return (this.shadowRoot ?? this) }
    #refs?: Record<string, HTMLElement>;

    /**
     * getter for refs
     */
    get refs() {
        return this.#refs;
    }


    get $data_scripts(): { id: string, script: string }[] {
        // @ts-ignore data scripts
        return this.constructor.$data_scripts ?? [];
    }
    /**
   * inital content of the element
   */
    initalContent?: Node;

    // where scope is stored
    #scope: Map<string, any> = new Map();
    // where scope is access
    scope = new Proxy({}, {
        get: (_, name: string) => {
            return this.#scope.get(name);
        },
        set: (_, name: string, value: any) => {
            this.#scope.set(name, value);
            return true;
        }
    });

    data: Record<string, any> = {};
    /**
     * attributeChanged function for the element
     */
    attributeChanged: (name: string, oldValue: string, newValue: string) => void = () => { };
    /**
     * attributeChangedCallback for the element
     * @param name the name of the attribute
     * @param oldValue the old value of the attribute
     * @param newValue the new value of the attribute
     */
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (this.attributeChanged) {
            this.attributeChanged(name, oldValue, newValue);
        }
    }

    hookRefs() {
        this
            .getAttributeNames()
            .filter((name) => name.startsWith("on"))
            .forEach((name) => {
                const attr_val = this.getAttribute(name) ?? "";
                // @ts-expect-error assigning event handlers by name nothing to see here
                this[name] = (_event) => new AsyncFunction("self", "event", "scope", attr_val)
                    (this, _event, this.scope);
            });

        this.shadowRoot?.querySelectorAll("[id]").forEach((ref) => {
            const event_attrs = ref
                .getAttributeNames()
                .filter((name) => name.startsWith("on"));

            event_attrs.forEach((name) => {
                const attr_val = ref.getAttribute(name) ?? "";
                // @ts-expect-error assigning event handlers by name nothing to see here
                ref[name] = (_event) => {
                    new AsyncFunction("self", "event", "el", "refs", "data", "scope", attr_val)
                        (this, _event, ref, this.refs, this.data, this.scope);
                }
            });

            if (!ref.matches(settings.refs_no_inital_load.join(","))) {
                ref.dispatchEvent(new Event("load", { bubbles: false, cancelable: false }));
            }
        });
    }

    generateScope() {
        const pushScope = (scope: Record<string, any>) => {
            for (let key in scope) {
                // @ts-ignore
                this.scope[key] = scope[key];
            }
        }
        type ScopeResolution = Record<string, any> | Function | typeof AsyncFunction;

        const scopeFunctions: Promise<ScopeResolution>[] = this.$data_scripts
            .map(({ script }) => {
                return new AsyncFunction
                    ("self", "refs", "data", "states", script) // @ts-ignore Internals.states DOES exist
                    (this, this.#refs, this.data, this.#internals?.states);
            });
        return Promise.all(scopeFunctions).then(scopes => {
            scopes.forEach((scope) => {
                // I want this but cant have it right now, await should still work in the script
                // if (scope && scope.constructor.name === "AsyncFunction") {
                //   pushScope(await (scope as typeof AsyncFunction)());
                // }
                if (
                    scope instanceof Function &&
                    !(scope instanceof Promise)
                ) {
                    pushScope(scope());
                } else {
                    pushScope(scope);
                }

            });
        });

        // TODO Add addtionals to scope

    }
    constructor() {
        super();
        this.#internals = this.attachInternals();
    }

}