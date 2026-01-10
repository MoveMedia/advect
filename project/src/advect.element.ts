import {
  AdvectSettings,
  AsyncFunction,
  AttrTypes,
  createAdvectContext,
  getScriptVars,
  type AdvectContext,
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
import type { HTMLNode } from "./advect.HTMLNode";

// custom elements my not be defined or ready when you access them
// the same is not true for regular dom elements
// so lets wrap all of them
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
  $vm: AdvectVM | null = null;

  get $style() {
    return this.$settings.style;
  }

  get $stylesheet(): CSSStyleSheet {
    // @ts-ignore
    return this.constructor.$stylesheet;
  }

  #internals: ElementInternals;
  /**
   *
   */
  get $settings() {
    // @ts-ignore Assigned by componnet builder
    return this.constructor.$settings as CustomElementSettings;
  }
  #shadow!: ShadowRoot;
  get $shadow() {
    return this.#shadow;
  }

  get $domRoot(): HTMLElement | ShadowRoot {
    const root = this.$settings.root === "shadow" ? this.#shadow : this;
    return root;
  }

  //#eta = createEta();
  #reactiveDispose!: Dispose;
  #getScope!: () => Scope | null;
  #state: Map<string | Symbol, WriteSignal<any>> = new Map();
  get state() {
    return this.#state;
  }
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
        } else {
         this.#state.set(p, signal(newValue));
        }
        return true
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
        const ref = this.$domRoot.querySelector(`[ref="${key as string}"]`);
        return refHandle(ref as HTMLElement);
      },
    }
  );

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

        return true;
        // }
        // return false;
      },
    }
  );

  constructor() {
    super();
    this.#internals = this.attachInternals();

    this.render.bind(this);
    this.hook.bind(this);
    //  this.#reactiveDispose = dispose;
      // @ts-ignore also a little sussy
      this.$vm = this.constructor?.$advectVMProvider?.call(this, {
        $state: this.$state,
        state: this.state,
        $element: this,
        $refs: this.$refs,
        $attr: this.$attr,
        $internals: this.#internals,
     //   $dispose: dispose,
        $computed: computed,
        $getContext: getContext,
        $tick: tick,
        $scope: getScope,
      });

      this.#getScope = () => getScope();
      effect(() => {
        this.render();
      });
  }

  anyAttrChanged:
    | ((name: string, value: string | null, oldValue: string | null) => void)
    | null = null;

  connectedCallback() {
    if (this.$settings.root == "shadow") {
      this.#shadow = this.attachShadow({ mode: this.$settings.shadow });
      this.#shadow.adoptedStyleSheets = [this.$stylesheet];
    } else {
      if (document.adoptedStyleSheets.indexOf(this.$stylesheet) == -1) {
        document.adoptedStyleSheets.push(this.$stylesheet);
      }
    }
    requestAnimationFrame(() => {
      try {
        this?.$vm?.onConnect?.call(this);
        this.render();
      } catch (e) {
        console.warn(e);
      }
    });
  }

  connectedMoveCallback() {
    try {
      this.$vm?.onMove?.call(this);
    } catch (e) {
      console.warn(e);
    }
  }

  disconnectedCallback() {
    //this.#reactiveDispose();
    try {
      this?.$vm?.onDisconnect?.call(this);
    } catch (e) {
      console.warn(e);
    }
  }

  adoptedCallback() {
    try {
      this.$vm?.onAdopt?.call(this);
    } catch (e) {
      console.warn(e);
    }
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    requestAnimationFrame(() => {
      this.$vm?.onWatchedAttrChanged?.call(this, name, newValue, oldValue);
    });
  }

  render() {
    if (!this.isConnected) return;
    const context = createAdvectContext(this);

    const markup = this.$settings.layoutNodes
      // try {
      .map((ln) => {
        ln.hydrate(context);
        return ln.html();
      })
      .join("\n");

    requestAnimationFrame(() => {
      this.$domRoot.innerHTML = markup;
      //  if (this.tagName == 'CHARACTER-CARD') console.log(this.tagName, "rendering", markup);

      this.hook(context);
    });

    // } catch (e) {
    //   console.error(e);
    // }
  }
  hook(context: AdvectContext) {
    const refEls = [
      // @ts-ignore
      ...this.querySelectorAll("[ref]"),
      // @ts-ignore
      ...(this.shadowRoot?.querySelectorAll("[ref]") || []),
    ] as HTMLElement[];
    for (let refEl of refEls) {
      const refId = refEl.getAttribute("ref") as string;
      const refNode = context.refs.get(refId);
      if (!refNode) continue;
      const finalObj = { ...context, ...(refNode?.locals ?? {}) };
      const contextScript = getScriptVars(finalObj);

      const event_attrs = refEl
        .getAttributeNames()
        .filter((name: string) => AdvectSettings.events.indexOf(name) != -1);
      // todo maybe make this a setting, I could see this causing unnecessary rendering

      event_attrs.forEach((name: string) => {
        const attr_val = refEl.getAttribute(name) ?? "";
        // @ts-expect-error assigning event handlers by name nothing to see here
        refEl[name] = (_event) => {
          new AsyncFunction(
            "context",
            "$event",
            "$this",
            `${contextScript} ${attr_val}`
          )(finalObj, _event, refEl);
        };
      });
         const exp = refEl.innerHTML.matchAll(/\{\{(.*?)\}\}/g);
      exp.forEach((v) => {
        const contentScript = v[1].trim();
        const finalScript = `${contextScript}\nreturn ${contentScript}`;
        const res = new Function("context", "ref", finalScript)(
          finalObj,
          refNode
        );
        refEl.innerHTML = refEl.innerHTML.replace(v[0], res);
      });
      Object.keys(refNode.attributes)
        .filter(
          (k: string) => !Object.hasOwn(AdvectSettings.attributes.directives, k)
        )
        .filter((name: string) => AdvectSettings.events.indexOf(name) == -1)
        .forEach((k: string) => {
          const v = `${refNode.attributes[k]}`.trim();
          if (v.startsWith("{") && v.endsWith("}")) {
            const attrScript = v.substring(1, v.length - 1);
            const finalScript = `${contextScript}\nreturn ${attrScript}`;
            const res = new Function("context", "ref", finalScript)(
              finalObj,
              refNode
            );
            if (this.tagName == "CHARACTER-CARD") {
              console.log({ k, v, res, finalScript, refEl });
            }
            setTimeout(() => {
              refEl.setAttribute(k, res);
              
            }, 200);
          }
        });
   

      if (
        refEl.matches("[onload]") &&
        !AdvectSettings.tags.onloadElements.find(
          (ole) => ole === refEl.tagName.toLocaleLowerCase()
        )
      ) {
        refEl.dispatchEvent(
          new Event("load", {
            bubbles: false,
          })
        );
      }
    }
  }
}
