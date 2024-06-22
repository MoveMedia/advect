import { $window } from "./utils";
import AdvectBase from "./AdvectBase";

/**
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
export class AdvectElement extends AdvectBase{
  /**
   * shadow mode can be open or closed
   */
  // @ts-ignore shadow mode
  static $shadow_mode?: "open" | "close";
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


  #slots = new Proxy({}, {
    get: (_, name: string) => {
      if (name === "default") {
        return this.shadowRoot?.querySelector('slot:not([name])');
      }
      const query = `slot[name="${name}"]`;
      return this.shadowRoot?.querySelector(query);
    },
    ownKeys: () => {
      return [...this.shadowRoot?.querySelectorAll('slot') ?? []].map(el => el.name);
    }
  });

  get slots() {
    return this.#slots;
  }
  
  /**
   * constructor for the element
   * sets the instance counter
   * sets the inital content
   */
  constructor() {
    super();
 
  }

  /**
   * connectedCallback for the element
   * super.connectedCallback() must be called in the child class
   * sets the inital content
   */
  connectedCallback() {
    super.connectedCallback();
    // @ts-ignore instance counter
    /// TODO validate use shadow at somepoint
    if (!this.shadowRoot)  return;

    // @ts-ignore template defined in build
    this.shadowRoot.innerHTML = this.$template.innerHTML;

    this.setupRefs();
    this.generateScope().then(() => {
      this.hookRefs()
      this.renderStyles();
      this.hookViews();
      
    });
    

  }


}

$window.AdvectElement = AdvectElement;
