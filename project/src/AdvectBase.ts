import { AdvectMutationEvent } from "./AdvectMutationEvent";
import { AdvectView } from "./AdvectView";
import settings from "./settings";
import { $window, AsyncFunction } from "./utils";
import Advect from "./advect";
import { createStore } from "zustand/vanilla";


/**
 * This is the base cass for All advect elements
 * 
 */
export default class AdvectBase extends HTMLElement {
    extras: Record<string, any> = {};
    /**
     *  Lib
     */
    get adv() {
        return $window.advect as Advect
    }

    static $shadow_mode: "open" | "close";
    /**
     * 
     */
    $style: CSSStyleSheet = new CSSStyleSheet();
    /**
     * 
     */

    /**
     * 
     */
    #internals: ElementInternals;
    /**
     * 
     */
    get internals() {
        return this.#internals;
    }
    /**
     * 
     */
    $scopes_scripts: { id: string, script: string }[] = [];

    /**
     * getter for the shadowRoot or the element itself
     */
    get refs(): Record<string, Element> {
        return this.allRefs.reduce((p, c) => {
            const id = c.dataset.ogid as string;
            return { ...p, [id]: c }
        }, {});
    }
    get views(): Record<string, Element> {
        return this.view_list.reduce((p, c) => {
            const id = c.dataset.ogid as string;
            return { ...p, [id]: c }
        }, {});
    }

    get view_list(): AdvectView[] {
        return this.allRefs.filter( r => r.tagName == 'ADV-VIEW') as AdvectView[];
    }
    /**
     * 
     */
    get allRefs() {
        return [...(this.shadowRoot?.querySelectorAll(`[id]`) ?? [])] as HTMLElement[];
    }


    /**
   * inital content of the element
   */
    initalContent?: Node;

    /**
     * 
     */
    _scope: Record<string, any> = new Map();
    /**
     * 
     */
    scope = new Proxy({}, {
        get: (_, name: string) => {
            return this._scope[name];
        },
        set: (_, name: string, value: any) => {
            this._scope[name] = value;
            return true;
        },
        ownKeys: () => {
            return [...this._scope.keys()];
        }
    });
    /**
     * 
     * @param scope 
     */
    mergeScope(scope: Record<string, any>) {
        for (let key in scope) {
            // @ts-ignore
            this._scope[key] = scope[key];
        }
    }


    /**
     * Adds a cssStyleSheet to the element
     * @param styles 
     */
    mergeStyles(styles: CSSStyleSheet[]) {
        this.shadowRoot?.adoptedStyleSheets.push(...styles);
    }


    /**
     * A helper for the dataset that when set calls render
     */
    data: Record<string, any> = new Proxy({},{
        get: (_, name:string) => {
            return this.dataset[name];
        },
        set: (_, name:string, value) => {
            this.dataset[name] = value;
            this.render();
            return true;
        }
    });
    /**
     * attributeChanged function for the element
     */
    onAttr: (name: string, oldValue: string, newValue: string) => void = () => { };
    /**
     * attributeChangedCallback for the element
     * @param name the name of the attribute
     * @param oldValue the old value of the attribute
     * @param newValue the new value of the attribute
     */
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (this.onAttr) {
            this.onAttr(name, oldValue, newValue);
        }
    }
    /**
     *  This ts to id the references so they can be referenced in the scope
     */
    setupRefs() {
        this.shadowRoot?.querySelectorAll("[id]").forEach((ref) => {
            const new_id = `${this.nodeName.toLowerCase()}-${ref.id}`;
            try {
                (ref as HTMLElement).dataset.ogid = ref.id;
            } catch (e) { console.warn("Could not set ogid", e); }
            ref.id = new_id;
        });
    }
    /**
     * Sets up event listeners for refs (ie elements with ids)
     */
    hookRefs(): void {

        // light dom event handlers just 'this' element
        this
            .getAttributeNames()
            .filter((name) => name.startsWith("on"))
            .forEach((name) => {
                const attr_val = this.getAttribute(name) ?? "";
                if (name.toLowerCase() === "onmutate") {
                    this.onMutate = (_event) => new AsyncFunction("self", "event", "scope", attr_val)
                        (this, _event, this.scope);
                    return;
                }
                // @ts-expect-error assigning event handlers by name nothing to see here
                this[name] = (_event) => new AsyncFunction("self", "event", "scope", attr_val)
                    (this, _event, this.scope);
            });
        // refs
        this.shadowRoot?.querySelectorAll("[id]").forEach((ref) => {
            // @ts-ignore refs have a reference to this
            this.adv.plugins.ref_found(ref);
            ref.addEventListener('adv:mutation', (_event) => {
                this.mutate((_event as AdvectMutationEvent).detail);
            });

            this.observer.observe(ref, { attributes: true, childList: true, subtree: true });

            const event_attrs = ref
                .getAttributeNames()
                .filter((name) => name.startsWith("on"));
            // todo maybe make this a setting, I could see this causing unnecessary rendering


            event_attrs.forEach((name) => {
                const attr_val = ref.getAttribute(name) ?? "";

                if (name.toLowerCase() === "onmutate") {
                    ref.addEventListener('adv:mutation', (_event) => {
                        new AsyncFunction("self", "event", "el", "refs", "data", "scope", "createStore", attr_val)
                            (this, _event, ref, this.refs, this.data, this.scope, createStore);
                    });


                } else {
                    // @ts-expect-error assigning event handlers by name nothing to see here
                    ref[name] = (_event) => {
                        new AsyncFunction("self", "event", "el", "refs", "data", "scope",  "createStore", attr_val)
                            (this, _event, ref, this.refs, this.data, this.scope, createStore);
                    }
                }
            });

            if (!ref.matches(settings.refs_no_inital_load.join(","))) {
                ref.dispatchEvent(new Event("load", { bubbles: false, cancelable: false }));
            }
        });
    }

    /**
     * Merges the scope and styles of the views in the shadowRoot
     * and sets the parent of the view to this element
     */
    hookViews(): void {
        this.shadowRoot?.querySelectorAll('adv-view').forEach(v => {
            const view = v as AdvectView;
            view?.mergeScope(this._scope);
            view?.mergeStyles(this.shadowRoot?.adoptedStyleSheets ?? [])
            // @ts-ignore
            view.parent = this;
        });
    }
    /**
     * Generates the scope for the element
     * all scripts besides the one designated as the module script are run in the scope of the element
     * these scripts
     * @returns 
     */
    generateScope() {
        type ScopeResolution = Record<string, any> | Function | typeof AsyncFunction;
        const scopeFunctions: Promise<ScopeResolution>[] = this.$scopes_scripts
            .map(({ script }) => {
                return new AsyncFunction
                    ("self", "refs", "data", "istates", "createStore", script) // @ts-ignore Internals.states DOES exist
                    (this, this.refs, this.data, this.internals?.states, createStore);
            });
        return Promise.all(scopeFunctions).then(async scopes => {
            for (let scope of scopes) {
                if (scope && scope.constructor.name === "AsyncFunction") {
                    this.mergeScope(await (scope as typeof AsyncFunction)());
                }
                if (scope instanceof Function) {
                    this.mergeScope(scope());
                } else {
                    this.mergeScope(scope);
                }
            }

        });
        // TODO Add addtionals to scope
    }
    static _observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            const event = new AdvectMutationEvent(mutation);
            mutation.target.dispatchEvent(event);
        });
    })
    get observer() {
        // @ts-ignore
        return this.constructor._observer;
    }
    /**
     * 
     */
    constructor() {
        super();
        // @ts-ignore
        this.#internals = this.attachInternals();
        this.generateScope = this.generateScope.bind(this);
        this.addEventListener("adv:mutation", (event) => {
            const mutation = (event as AdvectMutationEvent).detail;
            this.mutate(mutation);
        });
        this.style.display = "block";

    }

    onConnect?: () => void;
    connectedCallback() {
        //@ts-ignore
        this.constructor.ic++;

        this.initalContent = this.cloneNode(true);
        this.attachShadow({ mode: "open" });
        this.mergeStyles([this.$style]);

        // observe all changes on the light dom
        this.observer?.observe(this, {
            attributes: true,
            characterData: true,
            childList: true,
            subtree: true
        });
        this.observer?.observe(this.shadowRoot, {
            childList: true,
            subtree: true
        });
        this.shadowRoot?.querySelectorAll('style').forEach(style => {
            const css = new CSSStyleSheet();
            css.replaceSync(style.textContent ?? "");
            this.mergeStyles([css]);
        });
        this.adv.plugins.component_connected(this);
    }

    onMutate?: (mutation: MutationRecord) => void;
    mutate(mutation: MutationRecord) {
        if (this.onMutate) {
            this.onMutate(mutation);
        }
        this.adv.plugins.component_mutated(this, mutation);

    };
    onDisconnect?: () => void;
    disconnectdCallback() {
        if (this.onDisconnect) {
            this.onDisconnect();
        }
    }
    /**
     * 
     * @param selector 
     * @param base 
     * @param __Closest 
     * @returns 
     */
    closestElement(
        selector: string,      // selector like in .closest()
        base = this,   // extra functionality to skip a parent
        // @ts-ignore
        __Closest = (el, found = el && el.closest(selector)) =>
            !el || el === document || el === window
                ? null // standard .closest() returns null for non-found selectors also
                : found
                    ? found // found a selector INside this element
                    : __Closest(el.getRootNode().host) // recursion!! break out to parent DOM
    ) {
        return __Closest(base);
    }

    onPluginDiscovered() {
        // TODO onPluginDiscovered
    }

    /**
     * Stubs to be used in adv-view, adv-of, and adv-for, adv-if 
     * @param _ 
     */
  async render(_?: Record<string, any>) {
    return "";
    }
}