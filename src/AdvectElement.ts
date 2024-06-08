import { $window, AsyncFunction } from "./utils";

export class AdvectElement extends HTMLElement {
    static $use_internals?: boolean;
    // @ts-ignore use internals
    get use_internals() { return this.constructor.$use_internals ?? false; }
    internals?: ElementInternals;
    static $shadow_mode?: string;
    // @ts-ignore shadow mode
    get shadow_mode() { return this.constructor.$shadow_mode ?? "open"; }
    // @ts-ignore Templating
    static ic = 0;
    // @ts-ignore instance counter
    get ic() { return this.constructor.ic; }
    get signature() { return `${this.nodeName.toLocaleLowerCase()}-${this.dataset["instance"]}`; }
    get root(): ShadowRoot | this { return (this.shadowRoot ?? this) }
    #refs?: Record<string, HTMLElement>;
    get refs() {
      return this.#refs;
    }
    initalContent?: Node;
    
    data: Record<string, any> = {};
    constructor() {
      super();
      this.dataset["instance"] = this.ic.toString();
    }
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {}
  
    connectedCallback() {
      // @ts-ignore instance counter
      this.constructor.ic++;
      /// TODO validate use shadow at somepoint
      
      this.attachShadow({ mode: this.shadow_mode });
      this.initalContent = this.cloneNode(true);
      // @ts-ignore template defined in build
      this.shadowRoot?.appendChild(this.$template.content.cloneNode(true));
      const loadRefs = [...this.root.querySelectorAll('[id]')].map((ref) => {
        const new_id = `${this.signature}-${ref.id}`;
        try{
            (ref as HTMLElement).dataset.ogid = ref.id;

        }catch(e){ console.warn("Could not set ogid", e);}
        ref.id = new_id;

        const event_attrs = ref
          .getAttributeNames()
          .filter((name) => name.startsWith("on"));
  
        event_attrs.forEach((name) => {
          const attr_val = ref.getAttribute(name) ?? "";
          // @ts-expect-error assigning event handlers by name nothing to see here
          ref[name] = ($event) =>{
            console.log("event", $event);
            return new AsyncFunction("self", "event", "el", attr_val)(this, $event, ref);
          } 
        });
       return ref;
      });


      if (this.use_internals) {
        this.internals = this.attachInternals();
      }
  

      const _this = this;
  
      this.#refs = new Proxy({}, {
        get: (_, id: string) => {
          const query = `[data-ogid="${id}"]`;
          return _this.root.querySelector(query);
        },
        ownKeys: () => {
          return [..._this.root .querySelectorAll('[data-ogid]')].map(el => el.id);
        }
      });
      

    loadRefs.forEach((ref) => { ref.dispatchEvent(new Event("load", { bubbles: false, cancelable: false })); });

    
    }
  }
$window.AdvectElement = AdvectElement;
