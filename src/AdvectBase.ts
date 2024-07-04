//import { create, cssomSheet } from "twind";
import { AdvMutationEvent } from "./advect";
import { AdvectView } from "./AdvectView";
import settings from "./settings";
import { AsyncFunction } from "./utils";

/**
 * This is the base class for Advect View and Advect Element
 * 
 */
export default class AdvectBase extends HTMLElement {
    static $shadow_mode: "open" | "close";
    /**
     * a stylesheet to use within the shadow dom, this sheet receives the twind styles
     */
    $style: CSSStyleSheet = new CSSStyleSheet();
    /**
     *  a twind sheet to use within the shadow dom
     */
    tw_sheet: any;
    /**
     *  the twind instance for this element
     */
    tw: any;
    /**
     *  Internals attached to the element
     * @private
     */
    #internals: ElementInternals;
    /**
     * internal state of the element
     */
    get internals() {
        return this.#internals;
    }
    /**
     *  the scope scripts of the element
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
     * Private scope of the element
     */
    _scope: Record<string, any> = new Map();
    /**
     *  the scope of the element
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
     * sets the scope of the element
     * feels like there should be a more elegant way to do this
     * if reactivity was going to built in it would come form here
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
           // this.tw(el.className)
        }
        if (el && el instanceof Array) {
            el.forEach(_el => {
              //  this.tw(_el.className)
            })
        }
        if (!el)
        {
            // twind on the shadow
            this.shadowRoot?.querySelectorAll('[class]').forEach(_el => {
              //  this.tw(_el.className)
            })
            // twind in the light dom
            this.querySelectorAll('[class]').forEach(_el => {
              //  this.tw(_el.className)
            })
        }
        
    }

    /**
     * the data of the element. Access via self.data or data in scope functions 
     */
    data: Record<string, any> = {};
    /**
     * attributeChanged function for the element
     * Accessed via self.onAttr scope functions
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
     * scans the element for refs and sets them up
     * takes the elements original id and sets it as a data-ogid attribute
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
     *  Adds handlers to all elements with an id attribute
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
        // shadow dom event handlers
        this.shadowRoot?.querySelectorAll("[id]").forEach((ref) => {
            // observe a mutation event on the ref, and mutate this element
            ref.addEventListener('adv:mutation', (_event) => {
                this.mutate((_event as AdvMutationEvent).detail);
            });
            // observe everything on the ref
            // maybe make this a setting on the ref
            this.observer.observe(ref, { attributes: true, childList: true, subtree: true });
            // gather the event attributes, they all start with on pretty sure
            const event_attrs = ref
                .getAttributeNames()
                .filter((name) => name.startsWith("on"));

            // add event listeners to the ref
            event_attrs.forEach((name) => {
                const attr_val = ref.getAttribute(name) ?? "";
                // if the event is onmutate, add a mutation event listener
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
            //  For elements that dont already have a load event, dispatch a load event
            if (!ref.matches(settings.refs_no_inital_load.join(","))) {
                ref.dispatchEvent(new Event("load", { bubbles: false, cancelable: false }));
            }
        });
    }
    /**
     * Special function just for adv-view elements
     * one is found it the template, it will be hooked up to the scope
     * and the styles of the view will be added to the shadowRoot
     */
    hookViews(): void {
        this.shadowRoot?.querySelectorAll('adv-view').forEach(v => {
            const view = v as AdvectView;
            view.mergeScope(this._scope);
            view.mergeStyles(this.shadowRoot?.adoptedStyleSheets ?? [])
        });
    }
    /**
     * Generates the scope of the element from the data_scripts
     * This is called after the element is connected
     * All data_scripts are functions evaluated in the context of the element.
     * the return value of a data_script is merged into the scope of the element
     * allowed return values are objects, functions, and async functions
     * if a function is returned, it is called and the return value is merged into the scope
     * if an async function is returned, it is awaited and the return value is merged into the scope
     * if an object is returned, it is merged into the scope
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
        
       // this.tw_sheet = cssomSheet({ target: this.$style })
       // const { tw } = create({ sheet: this.tw_sheet });
       // this.tw = tw;

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