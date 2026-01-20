import {
  AdvectSettings,
  AsyncFunction,
  createAdvectContext,
  getScriptVars,
  type AdvectVM,
  type CustomElementSettings,
} from "./advect.lib";


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
  get $internals() {
    return this.#internals;
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
  #stateMap: Map<string | Symbol, Record<string,any>>= new Map();
  get stateMap() {
    return this.#stateMap;
  }
  $state = new Proxy(
    {},
    {
      get: (_, key,) => {
          return this.#stateMap.get(key);
      },
      set: (_, p, newValue) => {
        this.#stateMap.set(p, newValue);
        this.render()
        return true
      },
      ownKeys: () => {
        return Array.from(this.#stateMap.keys()) as string[];
      },
    }
  );
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
        this.render()

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
    //this.hook.bind(this);
      // @ts-ignore also a little sussy
   
  }
  initVM(){
    // @ts-ignore
       this.$vm = this.constructor?.$advectVMProvider?.call(this, {
        $state: this.$state,
        state: this.state,
        $element: this,
        $refs: this.$refs,
        $attr: this.$attr,
        $internals: this.#internals,
     //   $dispose: dispose,
      });
  }

  anyAttrChanged:
    | ((name: string, value: string | null, oldValue: string | null) => void)
    | null = null;

  connectedCallback() {
    this.initVM()
    if (this.$settings.root == "shadow") {
      this.#shadow = this.attachShadow({ mode: this.$settings.shadow });
      this.#shadow.adoptedStyleSheets = [this.$stylesheet];
    } else {
      if (document.adoptedStyleSheets.indexOf(this.$stylesheet) == -1) {
        document.adoptedStyleSheets.push(this.$stylesheet);
      }
    }
    this.render();
    this?.$vm?.onConnect?.call(this);
   
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
    if (this.$vm == null) return;
    const context = createAdvectContext(this)
    const hook = (ref:HTMLElement) =>{
      const refData = context.$$$refs.get(ref.getAttribute('ref') ?? '');
      if (!refData) return;
      const event_attrs = ref
        .getAttributeNames()
        .filter((name: string) => AdvectSettings.events.indexOf(name) != -1);
      const eventScript = getScriptVars(refData, '$$$refData')

      event_attrs.forEach((name: string) => {
        const attr_val = ref.getAttribute(name) ?? "";
        // @ts-expect-error assigning event handlers by name nothing to see here
        ref[name] = (_event) => {
          new AsyncFunction(
            "$$$context",
            "$$$refData",
            "$event",
            "$this",
            "$state",
            "state",
            `${eventScript}; ${attr_val}`
          )(context,refData, _event, this, this.$state, this.state);
        };
      });
      

      Array.from(ref.attributes)
        .filter( a => !Object.hasOwn(AdvectSettings.attributes.directives, a.name) && AdvectSettings.events.indexOf(a.name) == -1)
        .forEach((a: Attr) => {
            if (a.value.startsWith("{") && a.value.endsWith("}")) {
                const contextScript = getScriptVars(refData, '$$$refData')
                const attrScript = a.value.substring(1, a.value.length - 1);
                const finalScript = `${contextScript}; return ${attrScript}`;
                const res = new Function("$$$context","$$$refData", "ref", "$state", "state", finalScript)(
                    context,
                    refData,
                    ref,
                    this.$state,
                    this.state
                  );
                a.value  = res;
            }
        });

      const exp = ref.innerHTML.matchAll(/\{\{(.*?)\}\}/g);
      exp.forEach((v) => {
        const contentScript = v[1].trim();
        const contextScript = getScriptVars(refData, '$$$refData')
        const finalScript = `${contextScript}\nreturn ${contentScript}`;
        const res = new Function("$$$context",'$$$refData', "ref","$state", "state", finalScript)(
          context,
          refData,
          ref,
          this.$state,
          this.state
        );
        ref.innerHTML = ref.innerHTML.replace(v[0], res);
      });

    }
    const cloneNode = this.$settings.layout?.cloneNode(true) as HTMLElement;
    const queue: Node[] = [...Array.from(cloneNode.children)] as HTMLElement[];

    while (queue.length > 0) {
      const el = queue.shift();
      const isHtmlElement = el instanceof HTMLElement;
      if (!isHtmlElement) continue;
  
      const refId = el?.getAttribute('ref') ?? '';
      const isRef = refId != null && refId.length > 0;
      const hasIfStatement = el?.hasAttribute('adv-if');
      const hasForStatement = el?.hasAttribute('adv-for');

      if (isRef){
        context.$$$refs.set(refId, {});
      }

      let ifResult = true
      if (hasIfStatement && isRef){
        const ifStatement = el.getAttribute('adv-if') ?? '';
        const ifScript =`
        const state = $$$context.state;
        const $state = $$$context.$state;
        const $element = $$$context.$element;
        const $refs = $$$context.$refs;
        const $attr = $$$context.$attr;
        return ${ifStatement}};
        `
        const ifFunction = new Function(ifScript);
        ifResult = ifFunction.call(this, context);
      }

      if (!ifResult) continue;


      if (hasForStatement && isRef){
        const forStatement = el.getAttribute('adv-for');
        el.removeAttribute('adv-for');
        if (!forStatement) continue;
        const split = forStatement?.split('of') ?? [];
        const arrayName = split.at(-1)
        const dataName = split.at(0)?.indexOf(',') != -1
          ? split.at(0)?.split(',')[0].trim()
          : split.at(0)?.trim();        
        const indexName = split.at(0)?.indexOf(',') != -1
          ? split.at(0)?.split(',')[1].trim()
          : '';

        const nodeDestination = el.parentElement;
        nodeDestination?.removeChild(el);
        context.$$$refs.delete(refId)
        
        const forClone = el.cloneNode(true);
        
        const forScript = `
        const state = $$$context.state;
        const $state = $$$context.$state;
        const $element = $$$context.$element;
        const $refs = $$$context.$refs;
        const $attr = $$$context.$attr;
        for(let ${indexName} = 0; ${indexName} < ${arrayName}.length; ${indexName}++){
          const ${dataName} = ${arrayName}[${indexName}];
          const $$$newNode = $$$forClone.cloneNode(true);
          const $$$newRefId = '${refId}_' + ${indexName};
          $$$newNode.setAttribute('ref', $$$newRefId);
          const newLocals = {...$$$context.$$$locals, ${indexName},${dataName}}
          $$$context.$$$locals = newLocals;
          $$$context.$$$refs.set($$$newRefId, newLocals);
          $$$queue.push(...Array.from($$$newNode.children));
          $$$nodeDestination.appendChild($$$newNode);
          $$$hook($$$newNode);
        
        }`;
        const forFunction = new Function("$$$context", "$$$nodeDestination", "$$$forClone",'$$$queue', '$$$hook', forScript)
        forFunction.call(this, context, nodeDestination, forClone, queue,hook)

      }
      if (isRef) hook(el);
      if (!hasForStatement) queue.push(...(Array.from(el.children)));


    }

    while (this.$domRoot.firstChild) {
      this.$domRoot.removeChild(this.$domRoot.firstChild);
    }
    this.$domRoot.appendChild(cloneNode)
  }
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
