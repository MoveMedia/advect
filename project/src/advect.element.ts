import {
  AdvectSettings,
  type AdvectVM,
  type CustomElementSettings,
} from "./advect.lib";
import { AdvectRenderer, runHook } from "./advect.render";


/**
 * Resolves an element ref, waiting for a custom element to be defined.
 * Custom elements may not be defined/ready when accessed; regular DOM
 * elements are returned immediately.
 */
export function refHandle(el: HTMLElement): Promise<HTMLElement | null> {
  return new Promise((resolve, reject) => {
    if (!el || !el.isConnected) {
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
  /** The component VM (lifecycle hooks auto-detected from setup), if any. */
  $vm: AdvectVM | null = null;

  /** Top-level bindings returned by the component's `<script setup>`. */
  $setup: Record<string, any> = {};

  /** The raw CSS text declared by the component's `<style>` blocks. */
  get $style() {
    return this.$settings.style;
  }

  /** The constructed stylesheet shared by all instances of this component. */
  get $stylesheet(): CSSStyleSheet {
    return (this.constructor as unknown as AdvectElement).$stylesheet;
  }
  /** The element internals (form association, ARIAM etc.) for this host. */
  get $internals() {
    return this.#internals;
  }
  #internals: ElementInternals;
  /** The parsed settings assigned to this component's class by the builder. */
  get $settings() {
    // @ts-ignore Assigned by componnet builder
    return this.constructor.$settings as CustomElementSettings;
  }
  #shadow!: ShadowRoot;
  /** The shadow root when `root="shadow"`, otherwise undefined. */
  get $shadow() {
    return this.#shadow;
  }

  /** The node the component renders into: the shadow root or the host itself. */
  get $domRoot(): HTMLElement | ShadowRoot {
    const root = this.$settings.root === "shadow" ? this.#shadow : this;
    return root;
  }

  //#eta = createEta();
  /** Backing store for `$state`/`state`. */
  #stateMap: Map<string | Symbol, Record<string,any>>= new Map();
  /** Direct access to the reactive state map. */
  get stateMap() {
    return this.#stateMap;
  }
  /** Reactive state proxy that schedules a render on every write. */
  $state = new Proxy(
    {},
    {
      get: (_, key,) => {
          return this.#stateMap.get(key);
      },
      set: (_, p, newValue) => {
        this.#stateMap.set(p, newValue);
        this.$scheduleRender()
        return true
      },
      ownKeys: () => {
        return Array.from(this.#stateMap.keys()) as string[];
      },
    }
  );
  /** Reactive state proxy that writes without scheduling a render. */
  state = new Proxy(
    {},
    {
      get: (_, key,) => {
          return this.#stateMap.get(key);
      },
      set: (_, p, newValue) => {
        this.#stateMap.set(p, newValue);
        return true
      },
      ownKeys: () => {
        return Array.from(this.#stateMap.keys()) as string[];
      },
    }
  );
  //  onMutation = (_: MutationRecord[]) => {};
  //  onIntersect = (_: IntersectionObserverEntry[]) => {};


  /**
   * References: accessing a key returns a promise for the matching `ref` element.
   */
  $refs = new Proxy(
    {},
    {
      get: (_, key) => {
        const ref = this.$domRoot.querySelector(`[ref="${key as string}"]`);
        return refHandle(ref as HTMLElement);
      },
    }
  );

  /** Attribute proxy: reads/writes host attributes and schedules a render on write. */
  $attr = new Proxy(
    {},
    {
      get: (_, name) => {
        // if (!this.isConnected) return null;
        // if (this.$settings.watched[name as string]) {
        //   const type = AttrTypes[this.$settings.watched[name as string].type];
        //   const hasAttr = this.hasAttribute(name as string);
        //   if (this.hasAttribute(name as string)) {
        //     // @ts-ignore
        //     return type?.parse(this.getAttribute(name as string) ?? "") ?? null;
        //   } else {
        //     // @ts-ignore
        //     return (type?.parse(
        //         this.$settings.watched[name as string].defaultValue ?? ""
        //       ) ?? null
        //     );
        //   }
        // }
        return this.getAttribute(name as string);
      },
      set: (_, name, value) => {
        let newValue = value;
        let oldValue = this.getAttribute(name as string);
        // if (this.isConnected) {
        //if (this.$settings.watched[name as string]) {
        //  const type = AttrTypes[this.$settings.watched[name as string].type];
        // @ts-ignore
        //  newValue =type?.store(this.getAttribute(name as string) ?? "") ?? null;
        //}
        this.setAttribute(name as string, newValue);
        this.anyAttrChanged?.call(this, name as string, newValue, oldValue);
        this.$scheduleRender()

        return true;
        // }
        // return false;
      },
    }
  );

  /** Per-element renderer that compiles and patches the layout. */
  #renderer = new AdvectRenderer(this);
  /** Guards against queuing more than one microtask render. */
  #renderQueued = false;

  /** Queues a render on the next microtask, coalescing repeated calls. */
  $scheduleRender() {
    if (this.#renderQueued) return;
    this.#renderQueued = true;
    queueMicrotask(() => {
      this.#renderQueued = false;
      this.render();
    });
  }

  constructor() {
    super();
    this.#internals = this.attachInternals();
  }
  /**
   * Runs the component's compiled `<script setup>`, stores its bindings on
   * `$setup`, and wires any top-level lifecycle functions into `$vm`.
   */
  initVM(){
    const provider = (this.constructor as unknown as {
      $advectVMProvider?: (ctx: any) => Record<string, any>;
    })?.$advectVMProvider;
    if (typeof provider !== "function") {
      this.$vm = null;
      this.$setup = {};
      return;
    }
    const bindings = provider.call(this, {
      $state: this.$state,
      state: this.state,
      $element: this,
      $refs: this.$refs,
      $attr: this.$attr,
      $internals: this.#internals,
    //   $dispose: dispose,
    }) ?? {};
    this.$setup = bindings;
    const vm: AdvectVM = {};
    for (const hook of AdvectSettings.setup.lifecycleHooks) {
      if (typeof bindings[hook] === "function") {
        (vm as Record<string, any>)[hook] = bindings[hook];
      }
    }
    this.$vm = vm;
  }

  /** Optional callback invoked whenever any attribute changes via `$attr`. */
  anyAttrChanged:
    | ((name: string, value: string | null, oldValue: string | null) => void)
    | null = null;

  /** Attaches the shadow root/adopted stylesheet, renders and fires `onConnect`. */
  connectedCallback() {
    this.initVM();
    if (this.$settings.root == "shadow") {
      this.#shadow = this.attachShadow({ mode: this.$settings.shadow });
      this.#shadow.adoptedStyleSheets = [this.$stylesheet];
    } else {
      if (document.adoptedStyleSheets.indexOf(this.$stylesheet) == -1) {
        document.adoptedStyleSheets.push(this.$stylesheet);
      }
    }
    this.render();
    runHook(this, "onConnect", this.$vm?.onConnect);
  }

  /** Fires the VM `onMove` hook when the element is moved in the document. */
  connectedMoveCallback() {
    runHook(this, "onMove", this.$vm?.onMove);
  }

  /** Fires the VM `onDisconnect` hook when the element leaves the DOM. */
  disconnectedCallback() {
    runHook(this, "onDisconnect", this.$vm?.onDisconnect);
  }

  /** Fires the VM `onAdopt` hook when the element is adopted into a new document. */
  adoptedCallback() {
    runHook(this, "onAdopt", this.$vm?.onAdopt);
  }

  /** Fires the VM `onWatchedAttrChanged` hook and schedules a render. */
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    requestAnimationFrame(() => {
      runHook(this, "onWatchedAttrChanged", () =>
        this.$vm?.onWatchedAttrChanged?.call(this, name, newValue, oldValue)
      );
      this.$scheduleRender();
    });
  }

  /** Clears the queued flag and runs a render pass. */
  render() {
    this.#renderQueued = false;
    this.#renderer.render();
  }
  /** Dynamically imports one or more modules and invokes `cb` with the results. */
  module( url : string | string[], cb: (module: any[]) => void){
    const _urls = Array.isArray(url) ? url : [url];
    const results = Promise.all(_urls.map(async (u) => {
      return await import(u);
    }));
    results.then((modules) => {
      cb.call(this,modules);
    });
  }

}
