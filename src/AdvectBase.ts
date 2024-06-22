import { create, cssomSheet } from "twind";
import { MutationSingleton } from "./advect";
import { AdvectView } from "./AdvectView";
import settings from "./settings";
import { AsyncFunction } from "./utils";


/**
 * 
 */
export default class AdvectBase extends HTMLElement {


    get $is_advect_element() {
        return true;
    }

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
        console.log(this.shadowRoot?.adoptedStyleSheets.length, this.nodeName)
    }
    renderStyles() {
        this.shadowRoot?.querySelectorAll('[class]').forEach(el => {
            this.tw(el.className)
        })
    }

    /**
     * 
     */
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

    hookViews():void{
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
                    this.mergeScope(scope());
                } else {
                    this.mergeScope(scope);
                }

            });
        });

        // TODO Add addtionals to scope
    }

    /**
     * 
     */
    constructor() {
        super();
        this.#internals = this.attachInternals();
        this.generateScope = this.generateScope.bind(this);
    }
    /**
     * 
     */
    connectedCallback() {
        //@ts-ignore
    this.constructor.ic++;

        this.initalContent = this.cloneNode(true);
        this.attachShadow({ mode: "open" });
        this.shadowRoot?.adoptedStyleSheets.push(...[this.$style]);
        this.tw_sheet = cssomSheet({ target: this.$style })
        const { tw } = create({ sheet: this.tw_sheet });
        this.tw = tw;
        MutationSingleton.instance?.observe(this, {
            attributes: true,
            characterData: true,
            childList: true,
            subtree: true
        });
        this.shadowRoot?.querySelectorAll('style').forEach(style => {
            const css = new CSSStyleSheet();
            css.replaceSync(style.textContent ?? "");
            this.shadowRoot?.adoptedStyleSheets.push(css);
        })

    }
    onMutate?: (mutation: MutationRecord) => void;
    mutate(mutation: MutationRecord) {
        if (this.onMutate) {
            this.onMutate(mutation);
        }
        this.renderStyles();

        
    };
    disconnectdCallback(){
         
    }


}