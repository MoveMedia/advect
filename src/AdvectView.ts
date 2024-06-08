import { $window } from "./utils";
import $m from 'mustache';


export class AdvectView extends HTMLElement {
    _mutationObserver: MutationObserver | null = null;
    get mutationObserver() {
      if (this._mutationObserver == null) {
        this._mutationObserver = new MutationObserver(() => {
          this.render();
        });
        this._mutationObserver.observe(this, { childList: true, subtree: true });
      }
      return this._mutationObserver;
    }
  
    static ic = 0;
    // @ts-ignore instance counter
    get ic() { return this.constructor.ic; }
  
    data: Record<string, any> = {};  
  
    #refs?: Record<string, HTMLElement>;
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
  
    initalContent?: Node;
  
    constructor() {
      super();
    }
    connectedCallback() {
      // @ts-ignore instance counter
      this.constructor.ic++;
      this.initalContent = this.cloneNode(true);
      this.attachShadow({ mode: "open" });
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
        if ($window.htmx) {
          $window.htmx.process(wrapper);
        }
        this.shadowRoot?.appendChild(wrapper);
        this.hookRefs();
      }
      return rendered
    }
  
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
          ref[name] = ($event) => new AsyncFunction("$self", "event", "el", attr_val)(this, $event, ref);
        });
        ref.dispatchEvent(new Event("load", { bubbles: false, cancelable: false }));
      });
    }
  
  }
$window.AdvectView = AdvectView;
