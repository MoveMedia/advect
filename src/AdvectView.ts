import { $window, AsyncFunction } from "./utils";
import $m from 'mustache';
import settings from "./settings";

const css = String.raw;

$m.tags = ['[[', ']]'];
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
        },
        
      });
      this.#refs = refs;
    }
    return this.#refs;
  }

  get allRefs() {
      return [...(this.shadowRoot?.querySelectorAll(`[id]`) ?? []) ];
  }

  /**
   * inital content of the element
   */
  initalContent?: Node;
  /**
   * constructor for the element
   */

  data_scripts: { id: string, script: string }[] = []
  main_script?: string;
  #scope: Record<string, any> = {};
  get scope() {
    return this.#scope;
  }

  mergeScope(scope: Record<string, any>) {
    for (let key in scope) {
      // @ts-ignore
      this.#scope[key] = scope[key];
    }
  }

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
    const defaultcss = new CSSStyleSheet();
    defaultcss.replaceSync(css`
        :host{
          display: block;
          contain: content;
          width: 100%;
          height: 100%;
        }
    `);
    this.shadowRoot?.adoptedStyleSheets.push(defaultcss);
    this.internals = this.attachInternals();
    this.render = this.render.bind(this);
    this.shadowRoot?.addEventListener("advect:render", () => {
      this.render();
    });
    this.render();

  }
  async render(additionalData?: Record<string, any>) {
    const view = {
      ...(additionalData ?? {}),
      ...this.dataset
    }
    const rendered = $m.render(this.innerHTML, view);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = rendered;
    while (this.shadowRoot?.firstChild) {
      this.shadowRoot.removeChild(this.shadowRoot.firstChild);
      }
    this.shadowRoot?.appendChild(wrapper);
    await this.generateScope()
      .then(() => {
        this.hookRefs();
      })
      .catch((err) => {
        console.error(err);
      });;

    console.log("rendering", rendered);
    //  console.log("rendering", data);

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
          new AsyncFunction("self", "event", "el", "refs", "data","scope", attr_val)
          (this, _event, ref, this.refs, this.data, this.scope);
        }
      });

      if (!ref.matches(settings.refs_no_inital_load.join(","))) {
        ref.dispatchEvent(new Event("load", { bubbles: false, cancelable: false }));
      }
    });
  }
  generateScope() {
 
    type ScopeResolution = Record<string, any> | Function | typeof AsyncFunction;

    this.data_scripts = [...this.shadowRoot?.querySelectorAll('script') ?? []]
      .map(script => {
        return { id: script.id, script: script.textContent as string }
      });

    const scopeFunctions: Promise<ScopeResolution>[] = this.data_scripts
      .map(({ script }) => {
        return new AsyncFunction
          ("self", "refs", "data", "states", script) // @ts-ignore Internals.states DOES exist
          (this, this.#refs, this.data, this.internals?.states);
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
}
$window.AdvectView = AdvectView;
