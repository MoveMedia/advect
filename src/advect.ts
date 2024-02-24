
// @ts-ignore
const html = String.raw;

export interface AdvectPlugin{
  name: string;
  version: string;
  description: string;
  install: (adv: Advect) => void;
}

export interface TypValidationResult<T> {
  isValid: boolean;
  hasValue: boolean;
  parsedValue: T;
}

export type TypeValidator<T> = (val:string) => TypValidationResult<T>;


const $window = (window as Window & any);
// A spot for holding all the templates
if (!$window.$adv_templates) {
    document.body.innerHTML += `<div id="$adv_templates" style="display:none;"></div>`;
}
const script_type = "";
const template_attr = "";
const ignored_attrs:string[] = [];
const processed_events = Object.keys(HTMLElement.prototype).filter((name) =>name.startsWith("on"));

const refs = new Map();
const types = new Map();
const callbacks = new Map();
const modules = new Map();
const plugins = new Map();

const core_plugin:AdvectPlugin = {
  name: "core",
  version: "0.0.1",
  description: "Core plugin for adv",
  install: function (adv) {
    adv.ignored_attrs.push("id", "adv", "data-shadow");
    adv.script_type = "text/adv";
    adv.attr_name = "adv";
    adv.type("string", (val:string) => {
      const isValid = typeof val === "string";
      return {
        isValid,
        hasValue: val ? true : false,
        parsedValue: val,
      };
    });

    adv.type("number", (val:string) => {
      const parsedValue = parseFloat(val);
      const isValid = !isNaN(parsedValue);
      return {
        isValid,
        hasValue: val ? true : false,
        parsedValue,
      };
    });
    adv.type("boolean", (val:any) => {
      const isValid =
        val === "true" ||
        val === "false" ||
        val === "1" ||
        val === "0" ||
        val === true ||
        val === false;
      false;
    
      const parsedValue = val === "true" || val === "1" || val === true;
      return {
        isValid,
        hasValue: val ? true : false,
        parsedValue,
      };
    });

    adv.type("bigint", (val:string) => {
      const parsedValue = BigInt(val);
      const isValid = !Number.isNaN(parsedValue)
      return {
        isValid,
        hasValue: val ? true : false,
        parsedValue,
      };
    });

    adv.type("callback", (val:string) => {
      let parsedValue;
      try{
        parsedValue = adv.callbacks.get(val);
      }
      catch(e){
        console.error(e);
      }
      const isValid = parsedValue instanceof Function;
      return {
        isValid,
        hasValue: val ? true : false,
        parsedValue,
      };
    });

    adv.type("json", (val:string) => {
      let parsedValue;
      try{
        parsedValue = JSON.parse(val);
      }
      catch(e){
        console.error(e);
      }
      const isValid = parsedValue instanceof Object;
      return {
        isValid,
        hasValue: val ? true : false,
        parsedValue,
      };
    });

    
  },
  
}
/**
 * Used to type the base class of a custom element
 */
type Constructor<T> = {
  new (...args: any[]): T;
}

type $BaseClass = Constructor<HTMLElement>;

const build = ($template:HTMLTemplateElement, $baseClass: $BaseClass | null) => {
  // Define the custom Element
  const _class = class extends ($baseClass ?? HTMLElement) {
    static #ic = -1;
    static get observedAttributes() {
      return $template
        .getAttributeNames()
        .filter((n) => $window.$adv.ignored_attrs.indexOf(n.toLowerCase()) === -1);
    }
    static #ATTR_DESC = $template
      .getAttributeNames()
      .filter((n) => $window.$adv.ignored_attrs.indexOf(n.toLowerCase()) === -1)
      .map((name) => {
        const type = $template.getAttribute(name) ?? "string";
        return [name, type];
      })
      .reduce((acc, [name, type]) => {
        acc[name.toLowerCase()] = type;
        return acc;
      }, {} as Record<string, string>);

    refs:Record<string, Node> = {};
    #originalContent!:HTMLElement;

    get signature() {
      return `${$template.id}-${this.dataset["instance"]}`;
    }
    #attr:NamedNodeMap|null = null;
    get attr() {
      return this.#attr;
    }
    attrChanged:(name:string, oldValue:string, newValue:string) => 
        void = (_name:string, _oldValue:string, _newValue:string) => {};

    attributeChangedCallback(name:string, oldValue:string, newValue:string) {
      this?.attrChanged(name, oldValue, newValue);
      this.#validateAttrs();
    }

    constructor() {
      super();
      (this.constructor as typeof _class).#ic++;
    }

    get ic () {
      return (this.constructor as typeof _class).#ic;
    }

    get attrDesc() {
      return (this.constructor as typeof _class).#ATTR_DESC;
    }

    connectedCallback() {
      // cant be set until the element is connected
      this.#attr = $adv.attr(this,(this.constructor as typeof _class).#ATTR_DESC);
      this.#originalContent = this.cloneNode(true) as HTMLElement;

      if ($template.dataset.shadow && $template.dataset.shadow === "open") {
        this.attachShadow({ mode: "open" });
        if (this.shadowRoot){
          this.shadowRoot.innerHTML = $template.innerHTML;
        }
      } else {
        this.innerHTML = $template.innerHTML;
      }
      this.dataset["instance"] = this.ic.toString();
      this.id = `${$template.id}-${this.ic}`;

      this.#evalSlots();
      this.#buildRefs();
      this.#evalScripts();
      this.#evalStyles();
      this.#validateAttrs();
    }


    disconnectedCallback() {
      // console.log("disconnected");
      this?.diconnected();
    }
    diconnected = () => {};

    #buildRefs() {
      // these guys are special
      const root = this.dataset.shadow ? (this.shadowRoot as ShadowRoot) : this

      const els = [
        ...root.querySelectorAll(
          "[id]"
        ),
      ];

      els.forEach((el) => {
        // change the id so that it is unique across all instances
        const og_id = el.id;

        requestAnimationFrame(() => {
          el.id = `${this.signature}-${el.id}`;
        });
        // Weakref these maybe
        // set global refsf
        // $$refs[el.id] = el;
        // set local refs
        this.refs[og_id] = el;
      });
    }
    async #evalScripts() {
      // need at one list to hook up the events
      const scripts = [...this.querySelectorAll("script")];
      const $self = this;
      // all scripts out put are merged into one scope
      let $scope = {};
      for (let s of scripts) {
        try {
          await async function () {
            const _$scope = await eval(
              "(async function(){" + s.textContent + "})()"
            );
            if (_$scope && _$scope.constructor.name === "AsyncFunction") {
              const __$scope = await _$scope();
              $scope = { ...$scope, ...__$scope };
            }
            if (
              _$scope instanceof Function &&
              !(_$scope instanceof Promise)
            ) {
              const __$scope = _$scope();
              $scope = { ...$scope, ...__$scope };
            }
            if (_$scope) {
              $scope = { ...$scope, ..._$scope };
            }
          }.call({ $self, $template, $modules: $adv.modules });
        } catch (e) {
          console.error(e);
        }
      }

      Object.values(this.refs).forEach((refEl) => {
        $window.$adv.hook(refEl, $self, $template, $scope, $adv.modules);
      });
    }

    #evalStyles() {
      //const styles = [...this.querySelectorAll("style")];
    }

    #evalSlots() {
      const renderedSlots = [...this.querySelectorAll("slot")];
      let defautSlotUsed = false;
      requestAnimationFrame(() => {
        renderedSlots.forEach((slot) => {
          const name = slot.getAttribute("name");
          if (name) {
            const slotContent = this.#originalContent?.querySelector(
              `slot[name=${name}]`
            );
            if (slotContent) {
              slot.outerHTML = slotContent.innerHTML;
            }
          } else {
            if (!defautSlotUsed) {
              const slotContent =
                this.#originalContent.querySelector(`slot:not([name])`);
              if (slotContent) {
                slot.outerHTML = slotContent.innerHTML;
                defautSlotUsed = true;
              }
            }
          }
        });
      });
    }
    #validateAttrs() {
      Object.keys(this.attrDesc).forEach((prop) => {
        const type = this.attrDesc[prop];
        const typeHandler = $window.$adv.types.get(type);
        const attr = this.getAttribute(prop);
        const { isValid, hasValue } = typeHandler.validate(attr);
        if (!isValid && hasValue) {
          console.error(`Invalid value "${attr}" for ${prop}, on ${this.id}`);
        }
      });
    }
  }
  customElements.define($template.id,_class);
}
const load = (url:string) => {
  console.log("Fetching template", url);
  return fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "text/html",
      accept: "text/html",
    },
  })
    .then((res) => res.text())
    .then((text) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
       [...document.querySelectorAll("template[id][adv]"),
      ].map((template) => template.id);
      [...doc.querySelectorAll("template[id][adv]")].forEach((template) => {
        // TODO maybe make upgrading components a thing
        const existingCustomElement = customElements.get(template.id);
        if (existingCustomElement) {
          console.warn(`Template with id ${template.id} already exists`);
          return;
        }
        console.log("Adding template", template.id);
        $window.$adv_templates.appendChild(template);
        $window.$adv.build(
          template,
          $window[template.getAttribute($window.$adv.template_attr) || "HTMLElement"]
        );
      });
    })
    .catch((e) => {
      console.error(`Could not parse template from request`, e);
    });
}
const hook = ($ref:HTMLElement, $self:HTMLElement, $template:HTMLTemplateElement, $scope:any, $modules:any) => {
  const event_attrs = $ref
    .getAttributeNames()
    .filter((name) => name.startsWith("on"));

  event_attrs.forEach((name) => {
    const attr_val = $ref.getAttribute(name) ?? "";
    // @ts-expect-error assigning event handlers by name nothing to see here
    $ref[name] = ($event:Event) => {
      (() => {
        eval("(async function(){" + attr_val + "})()").catch((e:Error) => {
          console.error({
            e,
            s: attr_val,
          });
        });
      }).call({
        $ref,
        $self,
        $event,
        $template,
        $scope,
        $$modules: $modules,
      });
    };
  });
  $ref.dispatchEvent(new Event("load", { bubbles: true }));
}
const attr = (el:HTMLElement, propDesc:Record<string, string>) => {
  // maybe we dont need the proxy list
  const attrProxyRegistry:Record<string, Attr> = {};

  const getProxy = (attribute:Attr, targetProp:string) => {
    // console.log("Getting proxy", attribute.name);
    if (
      Object.keys(attrProxyRegistry).indexOf(attribute.name.toLowerCase()) !==
      -1
    ) {
      return attrProxyRegistry[attribute.name.toLowerCase()];
    }
    const type = propDesc[attribute.name.toLowerCase()];
    const typeHandler = $window.$adv.types.get(type);

    const attrProxy = new Proxy(attribute, {
      get(target, prop, _receiver) {
        if (prop === "value") {
          return typeHandler.validate(target.value).parsedValue;
        }
        return attribute.value;
      },
      set(_target, prop, value) {
        if (prop === "value") {
          const { isValid, parsedValue } = typeHandler.validate(value);
          if (isValid) {
            //  console.log("Setting value", parsedValue);
            el.setAttribute(targetProp, parsedValue);
            return true;
          } else {
            console.error(`Invalid value for ${prop}, on ${el.id}`);
            return false;
          }
        }

        // @ts-expect-error
        return Reflect.set(...arguments);
      },
    });

    attrProxyRegistry[attribute.name.toLowerCase()] = attrProxy;

    return attrProxy;
  };
  // proxy on the list of attributes
  const attrListProxy = new Proxy(el.attributes, {
    get(_target, prop, _receiver) {
      if (typeof prop === 'string' && Object.keys(propDesc).indexOf(prop.toLowerCase()) !== -1) {
        // @ts-expect-error
        return getProxy(Reflect.get(...arguments), prop);
      }
        // @ts-expect-error
      return Reflect.get(...arguments);
    },
  });
  return attrListProxy;
}

const plugin = (object:AdvectPlugin) => {
    $window.$adv.plugins.set(object.name, object);
}
const cb = (callback: (...args : any[]) => any )=>{
  const randomName = Math.random().toString(36).substring(7);
  $window.$adv.callbacks.set(randomName, callback);
  return randomName;
}

const mod = (object:any, alias:string) => {
  if (alias) {
    $window.$adv.modules.set(alias, object);
  } else {
    $window.$adv.modules.set(object.name, object);
  }
}

const type = (name:string, validate:TypeValidator<any>) =>{
  // TODO: add validation for validator
  $window.$adv.types.set(name, {validate});
}

const ref = (_el:HTMLElement) => {

}

export type Advect = typeof $adv;
const $adv = $window.$adv = {
      processed_events,
      attr_name: template_attr,
      script_type,
      ignored_attrs,
      refs,
      types,
      callbacks,
      modules,
      plugins,
      mod,
      hook,
      load,
      build,
      attr,
      plugin,
      type,
      cb,
      ref,
  }

$adv.plugin(core_plugin);


// register all templates with vx attribute
document.addEventListener("DOMContentLoaded", () => {
  const plugins = [...$adv.plugins.values()];
  plugins.forEach((plugin) => {
    plugin.install($adv);
  });
  const templates = [
    ...document.querySelectorAll(`template[id][${$adv.attr_name}]`),
  ];
  templates.forEach((template) => {
    const existingCustomElement = customElements.get(template.id);
    if (existingCustomElement) {
      console.warn(`Custom element with id ${template.id} already exists`);
      return;
    }
    $window.$adv.build(
      template,
      $window[template.getAttribute($adv.attr_name) || "HTMLElement"]
    );
  });

  const scriptTemplates = [
    ...document.querySelectorAll(`script[type="${$window.$adv.script_type}"]`),
  ];
  scriptTemplates.forEach((script) => {
    const src = script.getAttribute("src");
    if (src) {
      $adv.load(src);
    }
  });
});
