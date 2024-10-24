import { AdvectConnectEvent, AdvectDisconnectEvent, AdvectMutationEvent } from "./events";
import { AdvectView } from "./AdvectView";
import config from "./config";
import { $window, AsyncFunction } from "./utils";
import Advect from "./advect";

/**
 * This is the base cass for All advect elements
 *
 */
export default class AdvectBase extends HTMLElement {
  extras: Record<string, any> = {};
  
  loaded = false;
  ready = false;
  /**
   *  Lib
   */
  get adv() {
    return $window.advect as Advect;
  }

  static $shadow_mode: "open" | "close";
  
  /**
   *
   */
  get $style(): CSSStyleSheet {
    // @ts-ignore set in build function for custom elements and inside of AdvectViews
    return this.constructor.$Style;
  }
  /**
   *
   */

  /**
   *
   */
  #internals: ElementInternals;
  /**
   *
   */
  get internals() {
    return this.#internals;
  }
  /**
   *
   */
  $scopes_scripts: { id: string; script: string }[] = [];

  /**
   * getter for the shadowRoot or the element it$self
   */
  get refs(): Record<string, Element> {
    return this.allRefs.reduce((p, c) => {
      const id =
        c.getAttribute("ref") ||
        c.tagName.toLowerCase() + "-" + Math.random().toString(36).substring(7);
      return { ...p, [id]: c };
    }, {});
  }
  get views(): Record<string, Element> {
    return this.view_list.reduce((p, c) => {
      const id = c.getAttribute("ref") as string;
      return { ...p, [id]: c };
    }, {});
  }

  get view_list(): AdvectView[] {
    return this.allRefs.filter((r) => r.tagName == "ADV-VIEW") as AdvectView[];
  }
  /**
   *
   */
  get allRefs() {
    return [
      ...(this.shadowRoot?.querySelectorAll(`[ref]`) ?? []),
      ...this.querySelectorAll(`[ref]`) 
    ];
  }

  /**
   * inital content of the element
   */
  initalContent?: Node;

  /**
   *
   */
  _scope: Record<string, any> = new Map();
  /**
   *
   */
  scope = new Proxy(
    {},
    {
      get: (_, name: string) => {
        return this._scope[name];
      },
      set: (_, name: string, value: any) => {
        this._scope[name] = value;
        return true;
      },
      ownKeys: () => {
        return [...this._scope.keys()];
      },
    }
  );
  /**
   *
   * @param scope
   */
  mergeScope(scope: Record<string, any>) {
    for (let key in scope) {
      // @ts-ignore
      this._scope[key] = scope[key];
    }
  }

  /**
   * Adds a cssStyleSheet to the element
   * @param styles
   */
  mergeStyles(styles: CSSStyleSheet[]) {
    this.shadowRoot?.adoptedStyleSheets.push(...styles);
  }

  /**
   * A helper for the dataset that when set calls render
   */
  data: Record<string, any> = new Proxy(
    {},
    {
      get: (_, name: string) => {
        return this.dataset[name];
      },
      set: (_, name: string, value) => {
        this.dataset[name] = value;
        this.render();
        return true;
      },
    }
  );
  
  

  attr: Record<string, any> = new Proxy(
    {},
    {
      get: (_, name: string) => {
        return this.getAttribute(name);
      },
      set: (_, name: string, value) => {
        this.setAttribute(name, value);
        return true;
      },
    }
  );

  /**
   * attributeChanged function for the element
   */
  onAttr: (name: string, oldValue: string, newValue: string) => void = () => {};
  /**
   * attributeChangedCallback for the element
   * @param name the name of the attribute
   * @param oldValue the old value of the attribute
   * @param newValue the new value of the attribute
   */
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (this.onAttr) {
      this.onAttr(name, oldValue, newValue);
    }
  }
  /**
   *  This ts to id the references so they can be referenced in the scope
   */

  /**
   * Sets up event listeners for refs (ie elements with ids)
   */
  hookRefs(): void {
    //const is_view = this.nodeName.toLocaleLowerCase() === 'adv-view';

    // light dom event handlers just 'this' element
    this.getAttributeNames()
      .filter((name) => name.startsWith("on"))
      .forEach((name) => {
        const attr_val = this.getAttribute(name) ?? "";
        if (name.toLowerCase() === "onmutate") {
          this.onMutate = (_event) =>
            new AsyncFunction("$self", "event", "scope", attr_val)(
              this,
              _event,
              this.scope
            );
          return;
        }
        // @ts-expect-error assigning event handlers by name nothing to see here
        this[name] = (_event) =>
          new AsyncFunction("$self", "event", "scope", attr_val)(
            this,
            _event,
            this.scope
          );
      });

    // refs
    this?.querySelectorAll("[ref]").forEach((ref) => {
      const closest_view = ref.closest('adv-view')
      if ((closest_view && closest_view != ref)){
        return;
      }
      // @ts-ignore refs have a reference to this
      this.adv.plugins.ref_found(ref, this);

      ref.addEventListener(AdvectMutationEvent.Type, (_event) => {
        this.mutate((_event as AdvectMutationEvent).detail);
      });

      this.observer.observe(ref, {
        attributes: true,
        childList: true,
        subtree: true,
      });

      const event_attrs = ref
        .getAttributeNames()
        .filter((name) => name.startsWith("on"));
      // todo maybe make this a setting, I could see this causing unnecessary rendering

      event_attrs.forEach((name) => {
        const attr_val = ref.getAttribute(name) ?? "";

        if (name.toLowerCase() === "onmutate") {
          ref.addEventListener("adv:mutation", (_event) => {
            try {
              new AsyncFunction(
                "$self",
                "event",
                "$this",
                "refs",
                "data",
                "scope",
                attr_val
              )(this, _event, ref, this.refs, this.data, this.scope);
            } catch (e) {
              console.error(e, attr_val, this);
            }
          });
        } else {
          try {
            // @ts-expect-error assigning event handlers by name nothing to see here
            ref[name] = (_event) => {
              new AsyncFunction(
                "$self",
                "event",
                "$this",
                "refs",
                "data",
                "scope",
                attr_val
              )(this, _event, ref, this.refs, this.data, this.scope);
            };
          } catch (e) {
            console.error(e, attr_val, this);
          }
        }
      });

      if (!ref.matches(config.refs_no_inital_load.join(","))) {
        ref.dispatchEvent(
          new Event("load", { bubbles: false, cancelable: false })
        );
      }
    });
     // refs
     this.shadowRoot?.querySelectorAll("[ref]").forEach((ref) => {
      const closest_view = ref.closest('adv-view')
      if ((closest_view && closest_view != ref)){
        return;
      }
      // @ts-ignore refs have a reference to this
      this.adv.plugins.ref_found(ref, this);

      ref.addEventListener(AdvectMutationEvent.Type, (_event) => {
        this.mutate((_event as AdvectMutationEvent).detail);
      });

      this.observer.observe(ref, {
        attributes: true,
        childList: true,
        subtree: true,
      });

      const event_attrs = ref
        .getAttributeNames()
        .filter((name) => name.startsWith("on"));
      // todo maybe make this a setting, I could see this causing unnecessary rendering

      event_attrs.forEach((name) => {
        const attr_val = ref.getAttribute(name) ?? "";

        if (name.toLowerCase() === "onmutate") {
          ref.addEventListener("adv:mutation", (_event) => {
            try {
              new AsyncFunction(
                "$self",
                "event",
                "$this",
                "refs",
                "data",
                "scope",
                attr_val
              )(this, _event, ref, this.refs, this.data, this.scope);
            } catch (e) {
              console.error(e, attr_val, this);
            }
          });
        } else {
          try {
            // @ts-expect-error assigning event handlers by name nothing to see here
            ref[name] = (_event) => {
              new AsyncFunction(
                "$self",
                "event",
                "$this",
                "refs",
                "data",
                "scope",
                attr_val
              )(this, _event, ref, this.refs, this.data, this.scope);
            };
          } catch (e) {
            console.error(e, attr_val, this);
          }
        }
      });

      if (!ref.matches(config.refs_no_inital_load.join(","))) {
        ref.dispatchEvent(
          new Event("load", { bubbles: false, cancelable: false })
        );
      }
    });
  }

  addEventListener(type: string, listener: EventListener, options?: boolean | AddEventListenerOptions ): void {
    super.addEventListener(type, listener, options)
    if (type ==  AdvectConnectEvent.Type && this.ready){
      this.dispatchEvent(new AdvectConnectEvent(this));
    }
  }
  /**
   * Merges the scope and styles of the views in the shadowRoot
   * and sets the parent of the view to this element
   */
  hookViews(): void {
    this.shadowRoot?.querySelectorAll("adv-view,[inject]").forEach((v) => {
      const view = v as AdvectView;
      view?.mergeScope(this._scope);
      view?.mergeStyles(this.shadowRoot?.adoptedStyleSheets ?? []);
      // @ts-ignore
      view.parent = this;
    });
  }
  /**
   * Generates the scope for the element
   * all scripts besides the one designated as the module script are run in the scope of the element
   * these scripts
   * @returns
   */
  generateScope() {
    type ScopeResolution =
      | Record<string, any>
      | Function
      | typeof AsyncFunction;
    const scopeFunctions: Promise<ScopeResolution>[] = this.$scopes_scripts.map(
      ({ script }) => {
        try {

        return new AsyncFunction("$self", "refs", "data", "istates", script)(
          // @ts-ignore Internals.states DOES exist
          this,
          this.refs,
          this.data,
          // @ts-ignore
          this.internals?.states
        );
    } catch (e) {
        console.error(e, script);
    }
      }
    );
    return Promise.all(scopeFunctions).then(async (scopes) => {
      for (let scope of scopes) {
        if (scope && scope.constructor.name === "AsyncFunction") {
          this.mergeScope(await (scope as typeof AsyncFunction)());
        }
        if (scope instanceof Function) {
          this.mergeScope(scope());
        } else {
          this.mergeScope(scope);
        }
      }
    });
    // TODO Add addtionals to scope
  }
  static _observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      const event = new AdvectMutationEvent(mutation);
      mutation.target.dispatchEvent(event);
    });
  });
  get observer() {
    // @ts-ignore
    return this.constructor._observer;
  }
  /**
   *
   */
  constructor() {
    super();
    // @ts-ignore
    this.#internals = this.attachInternals();
    this.generateScope = this.generateScope.bind(this);
    this.addEventListener(AdvectMutationEvent.Type, (event) => {
      const mutation = (event as AdvectMutationEvent).detail;
      this.mutate(mutation);
    });
    this.addEventListener(AdvectConnectEvent.Type, () => {
        if (this.ready) return;
        if (this.onConnect) this.onConnect();
    });

    this.addEventListener(AdvectDisconnectEvent.Type, () => {
      if (this.onDisconnect) this.onDisconnect();
  });

  }

  onConnect?: () => void;
  connectedCallback() {
    //@ts-ignore
    this.constructor.ic++
    this.initalContent = this.cloneNode(true);

  

    // observe all changes on the light dom
    this.observer?.observe(this, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
    if ( this.shadowRoot ){

      this.observer?.observe(this.shadowRoot, {
        childList: true,
        subtree: true,
      });
    }
    this.shadowRoot?.querySelectorAll("style").forEach((style) => {
      const css = new CSSStyleSheet();
      css.replaceSync(style.textContent ?? "");
      this.mergeStyles([css]);
    });
    this.adv.plugins.component_connected(this);
    this.dispatchEvent(new AdvectConnectEvent(this));
  }

  handleLoad(){
    if (this.hasAttribute("onload")){
      let _onload = () => new AsyncFunction(
        "$self",
        "event",
        "refs",
        "data",
        "scope",
        this.getAttribute("onload")
      )(this, this.refs, this.data, this.scope);
      _onload()
    }
  }

  onMutate?: (mutation: MutationRecord) => void;
  mutate(mutation: MutationRecord) {
    if (this.onMutate) {
      this.onMutate(mutation);
    }
    this.adv.plugins.component_mutated(this, mutation);
  }
  onDisconnect?: () => void;
  disconnectdCallback() {
    this.dispatchEvent(new AdvectDisconnectEvent(this));
  }

  
  onPluginDiscovered() {
    // TODO onPluginDiscovered
  }

  /**
   * Stubs to be used in adv-view, adv-of, and adv-for, adv-if
   * @param _
   */
  async render(_?: Record<string, any>) {
    return "";
  }
}
