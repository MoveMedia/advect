import { $window } from "./utils";
import $m from 'mustache';

$m.tags = [ '[[', ']]' ];
/**
 * A Untility element for rendering mustache templates
 */
export class AdvectView extends HTMLElement {
  /**
   * Mutation Observer for the element
   */
    #mutationObserver: MutationObserver | null = null;
    /**
     * getter for mutationObserver
     */
    get mutationObserver() {
      if (this.#mutationObserver == null) {
        this.#mutationObserver = new MutationObserver(() => {
          this.render();
        });
        this.#mutationObserver.observe(this, { childList: true, subtree: true });
      }
      return this.#mutationObserver;
    }

    internals?: ElementInternals;

    /**
     * instance counter
     */
    static ic = 0;
    /**
     * getter for *.constructor.ic
     */
    // @ts-ignore instance counter
    get ic() { return this.constructor.ic; }
    /**
     * data object for the element, used to store data on the element instance
     * accessed via  'data' or 'self.data' in templates
     */
    data: Record<string, any> = {};  
    /**
     * signature for the element. This will be used to give refs unique ids
     */
    #refs?: Record<string, HTMLElement>;
    /**
     * getter for refs
     */
    get refs() {
      const _this = this;
      if (this.#refs === null) {
        const refs = new Proxy({}, {
          get: (_, id: string) => {
            return _this.shadowRoot?.querySelector(`#${this.id}-${id}`);
          }
        });
        this.#refs = refs;
      }
      return this.#refs;
    }
  /**
   * inital content of the element
   */
    initalContent?: Node;
    /**
     * constructor for the element
     */
    constructor() {
      super();
    }
    /**
     * connectedCallback for the element
     * must call super.connectedCallback() if overriden
     */
    connectedCallback() {
      // @ts-ignore instance counter
      this.constructor.ic++;
      this.initalContent = this.cloneNode(true);
      this.attachShadow({ mode: "open" });
      this.internals = this.attachInternals();
      this.shadowRoot?.addEventListener("advect:render", () => {
        this.render();
      
      });
      this.render();
    }
    render(data?: Record<string, any>) {
      console.log("rendering", data);
      const rendered = $m.render(this.innerHTML, { ...this.dataset, ...(data ?? {}) });
      if (this.dataset["autorender"] != "false") {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = rendered;
        while (this.shadowRoot?.firstChild) {
          this.shadowRoot.removeChild(this.shadowRoot.firstChild);
        }
        
        this.shadowRoot?.appendChild(wrapper);
        this.hookRefs();
      }
      return rendered
    }
    /**
     * hookRefs function for the element
     */
    hookRefs() {
      this
        .getAttributeNames()
        .filter((name) => name.startsWith("on"))
        .forEach((name) => {
          const attr_val = this.getAttribute(name) ?? "";
          // @ts-expect-error assigning event handlers by name nothing to see here
          this[name] = ($event) => new AsyncFunction("$self", "event", attr_val)(this, $event);
        });
        
      this.shadowRoot?.querySelectorAll("[id]").forEach((ref) => {
        const event_attrs = ref
          .getAttributeNames()
          .filter((name) => name.startsWith("on"));
  
        event_attrs.forEach((name) => {
          const attr_val = ref.getAttribute(name) ?? "";
          // @ts-expect-error assigning event handlers by name nothing to see here
          return new AsyncFunction("self", "event", "el", "refs","data", attr_val)(this, $event, ref, this.#refs, this.data);
        });
        ref.dispatchEvent(new Event("load", { bubbles: false, cancelable: false }));
      });
    }
  
  }
$window.AdvectView = AdvectView;
