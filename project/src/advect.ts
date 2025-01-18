/**
 * Advect web component library. 
 * 
 */

import { Actions, type ActionKey } from "./advect.actions";
import { AsyncFunction, type CustomElementSettings,toModule } from "./lib";
import { Eta } from "eta";
import { cleanTemplate } from "./advect.render";
import { createStore } from "zustand/vanilla";
import type { StoreApi } from "zustand";



const createAdvectSharedWorker = () => {
  const openPromises = new Map<
    string,
    { resolve: Function; reject: Function }
  >();

  const worker = new SharedWorker(new URL("advect.sharedworker.js", import.meta.url).href, { type: "module" });
  worker.onerror = (e) => {
    console.warn("error", e);
  };
  worker.port.onmessage = (e) => {
    const pr = openPromises.has(e.data.$id) && openPromises.get(e.data.$id);
    if (e.data?.isError === true && pr) {
      pr.reject(e);
    }
    if (pr) {
      pr.resolve(e);
      openPromises.delete(e.data.$id);
    }
  };
  const messagePromise = async (
    action: string,
    data: Record<string, any> | any
  ) => {
    return new Promise((resolve, reject) => {
      const $id = Math.random().toString(36).substr(2, 9);
      openPromises.set($id, { resolve, reject });
      worker.port.postMessage({ action, data, $id });
    });
  };
  return {
    messagePromise,
    worker,
    type: "shared",
  };
};

const createAdvectDedicatedWorker = () => {
  const openPromises = new Map<
    string,
    { resolve: Function; reject: Function }
  >();

  const worker = new Worker(new URL('advect.worker.js',import.meta.url), { type: "module" });
  worker.onerror = (e) => {
    console.error("error", e);
  };
  worker.onmessage = (e) => {
    const pr = openPromises.has(e.data.$id) && openPromises.get(e.data.$id);
    if (e.data?.isError === true && pr) {
      pr.reject(e);
    }
    if (pr) {
      pr.resolve(e);
      openPromises.delete(e.data.$id);
    }
  };
  const messagePromise = async (action: string, data: Record<string, any>) => {
    return new Promise((resolve, reject) => {
      const $id = Math.random().toString(36).substr(2, 9);
      openPromises.set($id, { resolve, reject });
      worker.postMessage({ action, data, $id });
    });
  };
  return {
    messagePromise,
    worker,
    type: "dedicated",
  };
};

const createAdvectNoWorker = () => {
  const messagePromise = async (
    action: ActionKey,
    data: Record<string, any>
  ) => {
    // @ts-ignore
    return Actions[action as ActionKey].call(data);
  };
  return {
    messagePromise,
    worker: null,
    type: "no-worker",
  };
};

const createAdvect = () => {
  const { messagePromise } =
    typeof SharedWorker !== "undefined"
      ? createAdvectSharedWorker()
      : typeof Worker !== "undefined"
      ? createAdvectDedicatedWorker()
      : createAdvectNoWorker();

  const render = async (data: Record<string, any>) => {
    return messagePromise("prerender", data);
  };


  const log_channel = new BroadcastChannel('advect:log');
  log_channel.onmessage = (event) =>{
    console.log(event.data)
  }

  /**
   * Loads a webcomponent from a url or list of urls
   * @param urls 
   * @returns 
   */
const load  = async (urls:string|string[]) =>{
  const buildMsg = await messagePromise("load", { urls }) as MessageEvent<{result: CustomElementSettings[], id:string, action:ActionKey}>;
  const buildSettings = buildMsg.data.result;

  console.log('got my build settings', buildSettings)
  return createCustomElementClasses(buildSettings)
}

/**
 * Creates the "Class" that will be used to register users custom components
 * @param buildSettings 
 * @param register 
 * @returns 
 */
const createCustomElementClasses = (buildSettings:CustomElementSettings[], register =true) =>{
  const buildClasses: any[] = [];
  // todo try here
  for (let settings of buildSettings) {
    // for some reason ts thinks settings is used before being declared so let's add a pointer
    const $settings = settings;
    toModule(settings.module, []).then((module:any) => {
      const moduleClass = module?.default;
      console.log(settings.tagName, settings)
      const newClass = class extends (moduleClass || AdvectElement) {
        static observedAttributes = Object.keys($settings.watched_attrs);
        static settings = $settings;
      };
      if (register){
        customElements.define(settings.tagName, newClass as any);
      }
      buildClasses.push(newClass);
    });
  }

  return buildClasses;
}

  const build = async (template: string) => {
    const buildMsg = await messagePromise("build", { template }) as MessageEvent<{result: CustomElementSettings[], id:string, action:ActionKey}>;
    const buildSettings = buildMsg.data.result;
    return createCustomElementClasses(buildSettings)
  };

  /**
   * Loads Elements that are inlined in the document
   * @param _ the DOMContentLoaded Event
   */
  const onContent = (_: Event) => {
    document.querySelectorAll("template[id][adv]")
      .forEach((template) => advect.build(template.outerHTML));

    let templateScriptUrls:string[] = []
    document.querySelectorAll('script[type="text/adv"][src]').forEach( e =>{
      if (e.hasAttribute('src')){
        templateScriptUrls.push( e.getAttribute('src') ?? '')
      }
    })
    console.log('loading', templateScriptUrls)
    load(templateScriptUrls)

    document.removeEventListener("DOMContentLoaded", onContent);
  };
  document.addEventListener("DOMContentLoaded", onContent);

  return {
    render,
    build,
    load
  };
};

/**
 * Base class for AdvectElement and AdvectView
 */
export class AdvectBase extends HTMLElement {
  anyAttrChanged (_:string, __:string){}
  attr = new Proxy(
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
          this.anyAttrChanged(name as string, value);
          return true;
        }
        return false;
      },
    }
  );
  data = new Proxy(
    {},
    {
      get: (_, name) => {
        if (this.isConnected) {
          return this.dataset[name as string]
        }
        return null
      },
      set: (_, name, value) => {
        if (this.isConnected) {
        this.dataset[name as string] =value;
        this.anyAttrChanged("data-" + (name as string), value);
          return true;
        }
        return false;
      },
    }
  );


  #internals?: ElementInternals;
  get internals() {
    return this.#internals;
  }

  constructor() {
    super();
  }

  onAdopt = () => {};
  adoptedCallback() {
    this?.onAdopt();
  }

  onAttributeChange = (_: string, __: string, ___: string) => {};
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    this?.onAttributeChange(name, oldValue, newValue);
  }


  onConnect = () => {};
  connectedCallback() {
    this.#internals = this.attachInternals();
    this.dispatchEvent(new CustomEvent("connect"));
  }

  override addEventListener(
    type: unknown,
    listener: unknown,
    options?: unknown
  ): void {
    super.addEventListener(type as any, listener as any, options as any);
    if (type == "connect" && this.isConnected) {
      // @ts-ignore
      listener(new Event("connect", {}));
    }
  }
  onDisconnect = () => {};
  disconnectedCallback() {
    this?.onDisconnect();
  }


  onMutation = (_: MutationRecord[]) => {};
  onIntersect = (_: IntersectionObserverEntry[]) => {};
}

// custom elements my not be defined or ready when you access them
// the same is not true for regular dom elements
// so lets wrap all of them 
export function refHandle(el:HTMLElement):Promise<HTMLElement|null>{
  return new Promise((resolve, reject) =>{
    if (!el.isConnected) {
      resolve(null)
      console.log(el,'is not connected to the dom and cannot be a ref')
      return;
    }
    const isCustom = el.tagName.indexOf('-') != -1;
    if (!isCustom){
        resolve( el )
        return;
    }
    const isDefined = el.matches(':defined');
    if (!isDefined){
      customElements.whenDefined(el.tagName).then( _ => {
          resolve( el )
      }).catch( e => {
        reject(e);
      })
    }
    resolve( el )
  })
  
}

export class AdvectElement extends AdvectBase {
  get html() {
    return this.$settings.template;
  }
  get refs_list() {
    return this.$settings.refs;
  }
  refs = new Proxy({},
    {
      get: (_, key) => {
        const ref = this.querySelector(`[ref="${key as string}"]`) ||
        this?.shadowRoot?.querySelector(`[ref="${key as string}"]`); 
        if (ref) return refHandle(ref as HTMLElement);
        return null;
        
      },
    }
  );
  get $settings() {
    // @ts-ignore
    return this.constructor.settings as CustomElementSettings;
  }

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    this.setupInitialDom()
   // this.createIntersectObserver()
   // this.createMutationObserver();
    this.hookRefs();
    this?.onConnect();
  }
  
  setupInitialDom(){
    switch (this.$settings?.root) {
      case "shadow":
          this.attachShadow( {mode: this.$settings.shadow })
          if(this.shadowRoot) this.shadowRoot.innerHTML = `<div style="display:contents;" part="root">` + this.html + `</div>`;
        break;
      default:
      case "light":
        this.innerHTML = this.html;
        break;
    }
  }
  hookRefsShadow(){
    this.shadowRoot?.querySelectorAll("[ref]").forEach((ref) => {

      this.mutationObserver?.observe(ref, {
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
                attr_val
              )(this, _event, ref, this.refs, this.data);
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
                attr_val
              )(this, _event, ref, this.refs, this.data);
            };
          } catch (e) {
            console.error(e, attr_val, this);
          }
        }
      });

    });
  }
  hookRefsLight(){
    // refs
    this?.querySelectorAll("[ref]").forEach((ref) => {
    
      this.mutationObserver?.observe(ref, {
        attributes: true,
        childList: true,
        subtree: true,
      });

      const event_attrs = ref
        .getAttributeNames()
        .filter((name) => name.startsWith("on"));

      event_attrs.forEach((name) => {
        const attr_val = ref.getAttribute(name) ?? "";
          try {
            // @ts-expect-error assigning event handlers by name nothing to see here
            ref[name] = (_event) => {
              new AsyncFunction(
                "$self",
                "event",
                "$this",
                "refs",
                "data",
                attr_val
              )(this, _event, ref, this.refs, this.data);
            };
          } catch (e) {
            console.error(e, attr_val, this);
          }
      });

    });
     // refs
  }
  hookRefsSelf(){
    // light dom event handlers just 'this' element
    this.getAttributeNames()
      .filter((name) => name.startsWith("on"))
      .forEach((name) => {
        const attr_val = this.getAttribute(name) ?? "";
        if (name.toLowerCase() === "onmutate") {
          this.onMutation = (_event) =>
            new AsyncFunction("$self", "event", attr_val)(
              this,
              _event,
            );
          return;
        }
        // @ts-expect-error assigning event handlers by name nothing to see here
        this[name] = (_event) =>
          new AsyncFunction("$self", "event", attr_val)(
            this,
            _event,
          );
      });
  }
  hookRefs(): void {
    //const is_view = this.nodeName.toLocaleLowerCase() === 'adv-view';
    this.hookRefsSelf();
    this.hookRefsLight();
    this.hookRefsShadow();
    
  }
  /**
   * Mutation observer
   */
  #mut_obs?: MutationObserver;
  get mutationObserver() {
    return this.#mut_obs;
  }
  createMutationObserver() {
    if (this.$settings.mutation) {
      this.#mut_obs = new MutationObserver((records, _) => {
        this?.onMutation(records);
      });
      this.#mut_obs.observe(this, {
        ...this.$settings.mutation,
      });
      if (this.shadowRoot) {
        this.#mut_obs.observe(this.shadowRoot, {
          ...this.$settings.mutation,
        });
      }
    }
  }
/**
 * Intersecton Observer
 */
  #intersect_obs?: IntersectionObserver;
  get interectObserver() {
    return this.#intersect_obs;
  }
  createIntersectObserver() {
    if (this.$settings.intersection) {
        let root = undefined;
        if (this.$settings?.intersection?.root){
            root = this.querySelector(this.$settings?.intersection?.root)
        }
      this.#intersect_obs = new IntersectionObserver((entries, _) => {
        this.onIntersect(entries);
      }, {
        ...this.$settings.intersection,
        root
      });
    }
  }
}

export class AdvectView extends AdvectBase {
  override anyAttrChanged(_: string, __: string): void {
    this.render();
  }
  #eta = new Eta({
    useWith: true,
    tags: ['{{','}}'],
    parse: {
      /** Which prefix to use for evaluation. Default `""`, does not support `"-"` or `"_"` */
      exec: ">",
      /** Which prefix to use for interpolation. Default `"="`, does not support `"-"` or `"_"` */
      interpolate: "",
      /** Which prefix to use for raw interpolation. Default `"~"`, does not support `"-"` or `"_"` */
      raw: "~"
    }
  })
  #store:StoreApi<any> = createStore(($s, $g) => ({}))
  get store(){
    return this.#store;
  }
  get state(){
    return this.#store?.getState()
  }


  override connectedCallback(): void {
    this.attachShadow({mode:'open'});
    this.#store.subscribe((state, prevState) => {
      this.render();
    })
    this.render();
    super.connectedCallback()
  }
  get eta(){  return this.#eta; }

  render(){
    const clean = cleanTemplate(this.innerHTML, this.#eta.config)
    const rendered = `<div style="display:contents;" part="root">` + this.eta.renderString(clean, {
      self:this
    }) + `</div>`;
    if (this.shadowRoot){
      this.shadowRoot.innerHTML = rendered;
    }
  }

  
}
if (!customElements.get('adv-view')){
  customElements.define('adv-view', AdvectView);
}

// This is necessary so that elements have data
(window as any).AdvectElement = AdvectElement



export const advect = createAdvect();



