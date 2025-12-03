import {
  AsyncFunction,
  getEventMap,
  onloadElements,
  type AdvectVM,
} from "./lib";
import {
  root,
  signal,
  computed,
  effect,
  tick,
  getScope,
  type Dispose,
  getContext,
  type Scope,
  type WriteSignal,
} from "@maverick-js/signals";
import { type CustomElementSettings } from "./lib";

import { HTMLNode } from "./advect.HTMLNode";

const events = getEventMap();

// custom elements my not be defined or ready when you access them
// the same is not true for regular dom elements
// so lets wrap all of them
export function refHandle(el: HTMLElement): Promise<HTMLElement | null> {
  return new Promise((resolve, reject) => {
    if (!el.isConnected) {
      resolve(null);
      return;
    }
    const isCustom = el.tagName.indexOf("-") != -1;
    if (!isCustom) {
      resolve(el);
      return;
    }
    const isDefined = el.matches(":defined");
    if (!isDefined) {
      customElements
        .whenDefined(el.tagName)
        .then((_) => {
          resolve(el);
        })
        .catch((e) => {
          reject(e);
        });
    }
    resolve(el);
  });
}

/**
 * Base class for custom web elements
 */
export class AdvectElement extends HTMLElement {
  $vm: AdvectVM | null = null;
  #internals: ElementInternals;
  /**
   *
   */
  get $settings() {
    // @ts-ignore Assigned by componnet builder
    return this.constructor.$settings as CustomElementSettings;
  }
  #shadow!: ShadowRoot;
  get $domRoot(): HTMLElement | ShadowRoot {
    const root = this.$settings.root === "shadow" ? this.#shadow : this;
    return root;
  }

  $renderer: AdvectElement | null = null;
  //#eta = createEta();
  #reactiveDispose!: Dispose;
  #getScope!: () => Scope | null;
  #state: Map<string | Symbol, WriteSignal<any>> = new Map();
  $state = new Proxy(
    {},
    {
      get: (_, key) => {
        if (this.#state.has(key)) {
          const _signal = this.#state.get(key);
          if (!_signal) return null;
          return _signal();
        }
        return null;
      },
      set: (_, p, newValue) => {
        if (this.#state.has(p)) {
          const _signal = this.#state.get(p);
          _signal?.set(newValue);
          return true;
        } else {
          this.#state.set(p, signal(newValue));
          return true;
        }
      },
    }
  );
  //  onMutation = (_: MutationRecord[]) => {};
  //  onIntersect = (_: IntersectionObserverEntry[]) => {};

  /**
   * The original markup for the custom web element
   */
  get html() {
    return this.$settings.template;
  }
  /**
   * The original list of refs in the component
   */
  get refs_list() {
    return this.$settings.refs;
  }

  /**
   * References
   */
  $refs = new Proxy(
    {},
    {
      get: (_, key) => {
        const ref =
          this.querySelector(`[ref="${key as string}"]`) ||
          this?.shadowRoot?.querySelector(`[ref="${key as string}"]`);
        if (ref) return ref;
        return null;
      },
    }
  );
  /**
   * Refs of custom web elements returns a promise to the ref
   */
  fuzzyRefs = new Proxy(
    {},
    {
      get: (_, key) => {
        const ref =
          this.querySelector(`[ref="${key as string}"]`) ||
          this?.shadowRoot?.querySelector(`[ref="${key as string}"]`);
        if (ref) return refHandle(ref as HTMLElement);
        return null;
      },
    }
  );

  $attr = new Proxy(
    {},
    {
      get: (_, name) => {
        if (this.isConnected) {
          return this.getAttribute(name as string);
        }
        return null;
      },
      set: (_, name, value) => {
        if (this.isConnected) {
          this.setAttribute(name as string, value);
          this.anyAttrChanged?.call(this, name as string, value);
          return true;
        }
        return false;
      },
    }
  );
  #props: Record<string | symbol, any> = {};
  $props = new Proxy(
    {},
    {
      has: (_, name) => {
         if (!this.#props){
          this.#props = {};
        }
        return Object.hasOwn(this.#props, name);
      },
      get: (_, name) => {
         if (!this.#props){
          this.#props = {};
        }
        if (Object.hasOwn(this.#props, name)) {
          return this.#props[name];
        }
        return null;
      },
      set: (_, name, value) => {
        if (!this.#props){
          this.#props = {};
        }
        const hasKey = Object.keys(this.$settings.props).find(
          (k) => k === name
        );
        if (!hasKey) return false;
        this.#props[name] = value;
        return true;
      },
    }
  );
  setProps( props: Record<string | symbol, any> ){
    this.#props = props;
    this.render()
  }

  constructor() {
    super();
    let times_rendered = 0;
    this.#internals = this.attachInternals();
    
    root((dispose) => {
      this.#reactiveDispose = dispose;
      // @ts-ignore also a little sussy
      this.$vm = this.constructor?.$advectVMProvider?.call(this, {
        $: this.$state,
        $el: this,
        $props: this.$props,
        $refs: this.$refs,
        $attr: this.$attr,
        $internals: this.#internals,
      });
      this.#getScope = () => getScope();
      effect(() => {
        console.log("times rendered: ", times_rendered);
        this.render();
        times_rendered++;
      });
    });

    this.render.bind(this);
  }

  anyAttrChanged: ((name: string, value: string) => void) | null = null;

  onConnect: (() => void) | null = null;
  connectedCallback() {
    if (this.$settings.root == "shadow") {
      this.#shadow = this.attachShadow({ mode: this.$settings.shadow });
      this.render();
    }
    this?.onConnect?.call(this);
  }

  render() {
    if (!this.isConnected || !this.$domRoot) return;

    const frame: Record<string | number | symbol, any> = {
      $props: this.$props,
      $el: this,
      $: {},
    };
    this.#state.entries().forEach(([key, s]) => {
      frame["$"][key as string] = s();
    }); 

    const rendered = ''//HTMLNode.renderTree(this.$settings.layout ?? "", frame)
    this.$domRoot.innerHTML = rendered;

    requestAnimationFrame(() => this.hook());
  }
  hook() {
    
  }

  hookRef(ref: Element) {
    {
      const event_attrs = ref
        .getAttributeNames()
        .filter((name) => events.has(name));
      // todo maybe make this a setting, I could see this causing unnecessary rendering

      event_attrs.forEach((name) => {
        const attr_val = ref.getAttribute(name) ?? "";

        try {
          // @ts-expect-error assigning event handlers by name nothing to see here
          ref[name] = (_event) => {
            new AsyncFunction("$self", "$event", "$this", "$refs", attr_val)(
              this,
              _event,
              ref,
              this.$refs
            );
          };
        } catch (e) {
          +9;
          console.error(e, attr_val, this);
        }
      });
      if (
        ref.matches("[onload]") &&
        !onloadElements.find((ole) => ole === ref.tagName.toLocaleLowerCase())
      ) {
        ref.dispatchEvent(
          new Event("load", {
            bubbles: false,
          })
        );
      }
    }
  }
}
