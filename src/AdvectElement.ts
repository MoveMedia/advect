import { $window, AsyncFunction } from "./utils";

/**
 * Base class for all Advect Elements
 * this class is modified based on a given template element
 * the following properties are set after the template has been processed
  * CustomElement.prototype.$template = template;
  * CustomElement.prototype.$ref_ids = refs_ids;
  * CustomElement.prototype.$slots_names = slots_names;
  * CustomElement.constructor.observedAttributes = attrs.map(attr => attr.name.toLocaleLowerCase());
  * CustomElement.constructor.$shadow_mode = shadow_mode;
  * CustomElement.constructor.$use_internals = use_internals;
 */
export class AdvectElement extends HTMLElement {
  /**
   * Whether to use internals or not
   */
    static $use_internals?: boolean;
    /**
     * getter for *.constructor.use_internals
    */
    // @ts-ignore use internals
    get use_internals() { return this.constructor.$use_internals ?? false; }
    /**
     * internals object, if use-internals is true
     */
    internals?: ElementInternals;
    /**
     * shadow mode can be open or closed
     */
    static $shadow_mode?: string;
    /**
     * getter for *.constructor.shadow_mode
     */
    // @ts-ignore shadow mode
    get shadow_mode() { return this.constructor.$shadow_mode ?? "open"; }
    /**
     * instance counter
     */
    // @ts-ignore Templating
    static ic = 0;
    /**
     * getter for *.constructor.ic
     */
    // @ts-ignore instance counter
    get ic() { return this.constructor.ic; }
    /**
     * signature for the element. This will be used to give refs unique ids
     */
    get signature() { return `${this.nodeName.toLocaleLowerCase()}-${this.dataset["instance"]}`; }
    /**
     * getter for the shadowRoot or the element itself
     */
    get root(): ShadowRoot | this { return (this.shadowRoot ?? this) }
    /**
     * refs object, a proxy that returns elements by their id
     */
    #refs?: Record<string, HTMLElement>;
    /**
     * getter for refs
     */
    get refs() {
      return this.#refs;
    }
    /**
     * inital content of the element
     */
    initalContent?: Node;
    /**
     * data object for the element, used to store data on the element instance
     * accessed via  'data' or 'self.data' in templates
     */
    data: Record<string, any> = {};
    /**
     * constructor for the element
     * sets the instance counter
     * sets the inital content
     */
    constructor() {
      super();
      this.dataset["instance"] = this.ic.toString();
    }
    /**
     * attributeChanged function for the element
     */
    attributeChanged: (name:string, oldValue:string, newValue:string) => void = () => {};
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
     * connectedCallback for the element
     * super.connectedCallback() must be called in the child class
     * sets the inital content
     */
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
            return new AsyncFunction("self", "event", "el", "refs","data", attr_val)(this, $event, ref, this.#refs, this.data);
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
