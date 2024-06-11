import { $window, AsyncFunction } from "./utils";

import $, { Cash } from 'cash-dom'


/**
 * TODO turn on internals by defaults to access :host(:state(loading))::before { content: '[ loading ]' }
 * TODO weakrefs for refs
 * Im thinking we can use this css and add a 'state' property that can be set on the element
 */


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
   * Whether to use internals or not think this
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
  #internals?: ElementInternals;
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

  get $data_scripts() :{ id: string, script: string }[] {
    // @ts-ignore data scripts
    return this.constructor.$data_scripts ?? [];
  }


  #slots?: Record<string, HTMLElement>;

  get slots() {
    return this.#slots;
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
  // where scope is used
 

  /**
   * constructor for the element
   * sets the instance counter
   * sets the inital content
   */
  constructor() {
    super();
    this.dataset["instance"] = this.ic.toString();
    this.generateScope = this.generateScope.bind(this);
    if (this.use_internals) {
      this.#internals = this.attachInternals();
    }
  }
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
   * connectedCallback for the element
   * super.connectedCallback() must be called in the child class
   * sets the inital content
   */
  connectedCallback() {
    // @ts-ignore instance counter
    this.constructor.ic++;
    /// TODO validate use shadow at somepoint

    const root = this.attachShadow({ mode: this.shadow_mode });
    this.initalContent = this.cloneNode(true);
    // @ts-ignore template defined in build
    root.innerHTML = this.$template.innerHTML;
    const loadRefs = [...this.root.querySelectorAll('[id]:not(script)')].map((ref) => {
      const new_id = `${this.signature}-${ref.id}`;
      try {
        (ref as HTMLElement).dataset.ogid = ref.id;

      } catch (e) { console.warn("Could not set ogid", e); }
      ref.id = new_id;

      const event_attrs = ref
        .getAttributeNames()
        .filter((name) => name.startsWith("on"));

      event_attrs.forEach((name) => {
        const attr_val = ref.getAttribute(name) ?? "";
        // @ts-expect-error assigning event handlers by name nothing to see here
        ref[name] = (_event) => {
       //   console.log("event", _event);
          // @ts-ignore Internals.states DOES exist
          return new AsyncFunction
            ("self", "$self", "event", "el", "$el", "refs", "data", "states", "scope", "$", attr_val) // @ts-ignore Internals.states DOES exist
            (this, $(self), _event, ref, $(ref), this.#refs, this.data, this.#internals?.states, this.scope, $);
        }
      });
      return ref;
    });

    const _this = this;
    /**
     * refs
     * a proxy that returns elements by their id
     **/

    this.#refs = new Proxy({}, {
      get: (_, id: string) => {
        const query = `[data-ogid="${id}"]`;
        return _this.root.querySelector(query);
      },
      ownKeys: () => {
        return [..._this.root.querySelectorAll('[data-ogid]')].map(el => el.id);
      }
    });
   

    this.#slots = new Proxy({}, {
      get: (_, name: string) => {
        if (name === "default") {
          return _this.root.querySelector('slot:not([name])');
        }
        const query = `slot[name="${name}"]`;
        return _this.root.querySelector(query);
      },
      ownKeys: () => {
        return [..._this.root.querySelectorAll('slot')].map(el => el.name);
      }
    });

    this.generateScope().then(() => {

      loadRefs.forEach((ref) => { ref.dispatchEvent(new Event("load", { bubbles: false, cancelable: false })); });
    });

  }

  generateScope(){
    const pushScope = (scope: Record<string, any>)  =>{
      for (let key in scope) {
        this.scope[key] = scope[key];
      }
    }
    type ScopeResolution = Record<string, any> | Function | typeof AsyncFunction;

    const scopeFunctions: Promise<ScopeResolution>[] = this.$data_scripts
      .map( ({script , id}) => {
        return new AsyncFunction
            ("self", "$self", "refs", "data", "states", "$", script) // @ts-ignore Internals.states DOES exist
            (this, $(self), this.#refs, this.data, this.#internals?.states, $);
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
        }else{
          pushScope(scope);
        }
        
      });
    });

    // TODO Add addtionals to scope

  }
}

$window.AdvectElement = AdvectElement;
