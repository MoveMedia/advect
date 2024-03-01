
import { Parser } from "htmlparser2";
import * as domhandler from "domhandler";
import { $adv } from "./adv";

const html = String.raw;
const $window = (window as Window & any);


interface AdvParsedTemplate {
  template: domhandler.Element;
    import_scripts: domhandler.Element[];
    inline_scripts: domhandler.Element[];
    inline_styles: domhandler.Element[];
    ref_nodes: domhandler.Element[];
    markup_roots: domhandler.Element[];
} 

type Constructor<T> = {
  new (...args: any[]): T;
}

type $BaseClass = Constructor<HTMLElement>;



type AdvParseResult = Awaited<ReturnType<typeof parse>>;
export const parse = async (src: string) => {
    const templateDatas:AdvParsedTemplate[] = [];
    const handler = new domhandler.DomHandler((error, dom) => {
        if (!error) {
            //console.log(dom);
            dom.forEach((element) => {
              if (element.type === 'tag' && element.name === 'template') {
                  const templateData:AdvParsedTemplate = { template:element , markup_roots:[], import_scripts:[], inline_scripts:[], inline_styles:[], ref_nodes:[] }
                    element.children.forEach((child) => {
                        switch (child.type) {
                            case 'text':
                                break;
                            case 'style':
                                if (child.attribs.src) {
                                    //import_styles.push(child);
                                } else {
                                    templateData.inline_styles.push(child);
                                }
                                break;
                            case 'script':
                                if (child.attribs.src) {
                                    templateData.import_scripts.push(child);
                                } else {
                                    templateData.inline_scripts.push(child);
                                }
                                break;
                            case 'tag':
                                templateData.markup_roots.push(child);
                            break;
                            default:
                                break;
                        }
                    });

                const search_nodes:domhandler.ChildNode[] = templateData.markup_roots;
                // Nodes with Ids
                const ref_nodes:domhandler.Element[] = [];
            
                while(search_nodes.length > 0) {
                    const node = search_nodes.pop();
                    if (!node || node.type != 'tag') continue;
                    if (node.attribs.id){
                        ref_nodes.push(node);
                    }
                    if (node.children) {
                        search_nodes.push(...node.children);
                    }
                }
                templateDatas.push(templateData);
              }


            });

        } else {
            console.error(error);
        }
    });
    const parser = new Parser(handler);
    parser.write(src);
    parser.end();
    return templateDatas
}

const generate = async (pt:AdvParsedTemplate) => {
    const { template: $template, import_scripts, inline_scripts, inline_styles, ref_nodes, markup_roots } = pt;
  
    const $baseClassName = $template.attribs.adv ?? 'HTMLElement';
    const component_tag = $template.attribs.id;
    const watch_attr = $template.attribs;
    const shadow = $template.attribs['adv-shadow'];

    const _class = class extends ($window[$baseClassName] as $BaseClass ?? HTMLElement) {
      static #ic = -1;
      static get observedAttributes() {
        return $template.attributes.map(a => a.name)
          .filter((n) => $adv.ignored_attrs.indexOf(n.toLowerCase()) === -1);
      }
  
      refs:Record<string, Node> = {};
      // @ts-ignore
      #originalContent!:HTMLElement;  
  
      get signature() {
        return `${$template.attribs.id}-${this.ic}`;
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
  
      get root ():ShadowRoot|HTMLElement {
        return $template.attribs.shadow ? this.shadowRoot as ShadowRoot : this;
      }
  
      constructor() {
        super();
        (this.constructor as typeof _class).#ic++;
      }
  
      get ic () {
        return (this.constructor as typeof _class).#ic;
      }
  
      get attrDesc() {
        return $template.attributes.reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {} as Record<string,string>);
      }
  
      connectedCallback() {
        // cant be set until the element is connected
      //  this.#attr = $adv.attr(this,(this.constructor as typeof _class).#ATTR_DESC);
  
        this.#originalContent = this.cloneNode(true) as HTMLElement;
  
        if ($template.attribs.shadow && $template.attribs.shadow === "open") {
          this.attachShadow({ mode: "open" });
          if (this.shadowRoot){
            this.shadowRoot.innerHTML = $template.children.map((c) => c.toString()).join("");;
          }
        } else {
          this.innerHTML = $template.children.map((c) => c.toString()).join("");
        }
        this.id = `${$template.attribs.id}-${this.ic}`;
  
       // this.#evalSlots();
        // Refs need to come first so that $ref works in inline scripts
        this.#buildRefs();
        this.#evalScripts();
  
        this.#evalStyles();
        this.#validateAttrs();
      }
      // remove(): void {
      //   super.remove();
      //   try {
      //     const parent = document.getElementById(this.id)?.parentElement
      //     if (parent) {
      //       parent.removeChild(this);
      //       console.log("removed", this.id);
      //     }
      //   } catch (e) {
      //   }
      // }
  
      disconnectedCallback() {
        // console.log("disconnected");
        this?.diconnected();
      }
      diconnected = () => {};
  
      #buildRefs() {
        // these guys are special
        const els = [
          ...this.root.querySelectorAll(
            "[id]"
          ),
        ];
  
        console.log(els)
        els.forEach((el) => {
          // change the id so that it is unique across all instances
          const og_id = el.id;
  
          requestAnimationFrame(() => {
            el.id = `${this.signature}-${el.id}`;
          });
          // Weakref these maybe
          // set global refsf
            $adv.refs.set(el.id,el);
          // set local refs
          this.refs[og_id] = el;
        });
      }
      async #evalScripts() {
        // need at one list to hook up the events
        const scripts = [...this.root.querySelectorAll("script")];
        const $self = this;
  
        console.log("Scripts", scripts);
        // all scripts out put are merged into one scope
        let $scope = {};
        for (let s of scripts) {
          try {
            (await async function () {
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
            }).call({ $self, $template, $modules: $adv.modules });
          } catch (e) {
            console.error(e);
          }
        }
        console.log("Scope", $scope);
        console.log("Refs", this.refs);
        Object.values(this.refs).forEach((refEl) => {
          $window.$adv.hook(refEl, $self, $template, $scope, $adv.modules);
        });
      }
  
      #evalStyles() {
        //const styles = [...this.querySelectorAll("style")];
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

}


parse(html`

<script type="text/adv" src="components/todo-item.html"></script>
<template id="todo-component" data-shadow="open" adv>
  <style>
    .todo-wrapper {
    }
    form {
      background-color: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid var(--white);
      border-radius: 10px;
      padding: 10px;
      display: flex;
      flex-direction: column;
    }
  </style>
  <script>
    const onFinishCallback = "";
    const { form, input, list } = $self.refs;
    // testing refs
    const onSubmit = (e) => {
      console.log("submitting");
      e.preventDefault();
      input.value = "";
    };
    return {
      onSubmit,
    };
  </script>
  <div class="todo-wrapper">
    <form part="submit_form" id="form" onsubmit="$scope.onSubmit($event)">
      <slot name="title">
        <h2 class="font-bold">Todos</h2>
      </slot>
      <div>
        <label for="input">
          <span>Add a todo</span>
          <input id="input" type="text" name="todo-input" class="border-b-2 border-slate-500" required  />
        </label>
        <button class="">Submits</button>
      </div>
    </form>
    <ul id="list"></ul>
  </div>
</template>
`).then((parse) => {
  console.log(parse);
    return parse
})
.then((a) => {
})
.catch((err) => {
    console.error(err);
});
