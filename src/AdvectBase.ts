import { create, cssomSheet } from "twind";
import { AdvMutationEvent } from "./advect";
import { AdvectView } from "./AdvectView";
import settings from "./settings";
import { AsyncFunction } from "./utils";

/**
 * This is the base cass for All advect elements
 * 
 */
export default class AdvectBase extends HTMLElement {
    static $shadow_mode: "open" | "close";
    /**
     * 
     */
    $style: CSSStyleSheet = new CSSStyleSheet();
    /**
     * 
     */
    tw_sheet: any;
    /**
     * 
     */
    tw: any;
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
    data_scripts: { id: string, script: string }[] = [];

    /**
     * getter for the shadowRoot or the element itself
     */
    get refs(): Record<string, Element> {
        return this.allRefs.reduce((p, c) => {
            const id = c.dataset.ogid as string;
            return { ...p, [id]: c }
        }, {});
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
            this.scope[key] = scope[key];
        }
    }


    /**
     * Adds a cssStyleSheet to the element
     * @param styles 
     */
    mergeStyles(styles: CSSStyleSheet[]) {
        this.shadowRoot?.adoptedStyleSheets.push(...styles);
    }
    renderStyles(el?: HTMLElement | Array<HTMLElement>) {
        if (el && el instanceof HTMLElement) {
            this.tw(el.className)
        }
        if (el && el instanceof Array) {
            el.forEach(_el => {
                this.tw(_el.className)
            })
        }
        if (!el)
        {
            this.shadowRoot?.querySelectorAll('[class]').forEach(_el => {
                this.tw(_el.className)
            })
            this.querySelectorAll('[class]').forEach(_el => {
                this.tw(_el.className)
            })
        }
        
    }

    /**
     * 
     */
    data: Record<string, any> = {};
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
     * 
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
     * 
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
            ref.addEventListener('adv:mutation', (_event) => {
                this.mutate((_event as AdvMutationEvent).detail);
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
                        new AsyncFunction("self", "event", "el", "refs", "data", "scope", attr_val)
                            (this, _event, ref, this.refs, this.data, this.scope)
                    });


                } else {
                    // @ts-expect-error assigning event handlers by name nothing to see here
                    ref[name] = (_event) => {
                        new AsyncFunction("self", "event", "el", "refs", "data", "scope", attr_val)
                            (this, _event, ref, this.refs, this.data, this.scope);
                    }
                }
            });

            if (!ref.matches(settings.refs_no_inital_load.join(","))) {
                ref.dispatchEvent(new Event("load", { bubbles: false, cancelable: false }));
            }
        });
    }

    hookViews(): void {
        this.shadowRoot?.querySelectorAll('adv-view').forEach(v => {
            const view = v as AdvectView;
            view.mergeScope(this._scope);
            view.mergeStyles(this.shadowRoot?.adoptedStyleSheets ?? [])
        });
    }
    /**
     * 
     * @returns 
     */
    generateScope() {
        type ScopeResolution = Record<string, any> | Function | typeof AsyncFunction;
        const scopeFunctions: Promise<ScopeResolution>[] = this.data_scripts
            .map(({ script }) => {
                return new AsyncFunction
                    ("self", "refs", "data", "states", script) // @ts-ignore Internals.states DOES exist
                    (this, this.refs, this.data, this.internals?.states);
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
            const event = new AdvMutationEvent(mutation);
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
            const mutation = (event as AdvMutationEvent).detail;
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
        this.addShadowStyleSheet(this.$style);
        
        this.tw_sheet = cssomSheet({ target: this.$style })
        const { tw } = create({ sheet: this.tw_sheet });
        this.tw = tw;

        // observe all changes on the light dom
        this.observer?.observe(this, {
            attributes: true,
            characterData: true,
            childList: true,
            subtree: true
        });
        // this.observer?.observe(this.shadowRoot, {
        //     childList: true,
        //     subtree: true
        // });

        this.shadowRoot?.querySelectorAll('style').forEach(style => {
            const css = new CSSStyleSheet();
            css.replaceSync(style.textContent ?? "");
            this.shadowRoot?.adoptedStyleSheets.push(css);
        });
    }

    addShadowStyleSheet(style: CSSStyleSheet) {
        this.shadowRoot?.adoptedStyleSheets.push(style);
    }

    onMutate?: (mutation: MutationRecord) => void;
    mutate(mutation: MutationRecord) {
        if (this.onMutate) {
            this.onMutate(mutation);
        }
        if (mutation.attributeName === "class" && mutation.target === this){
            this.renderStyles();
        }
        if (!(mutation.target as HTMLElement).matches("[no-tw]")){
            this.renderStyles(mutation.target as HTMLElement);
        }
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
}