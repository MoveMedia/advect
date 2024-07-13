import { toModule} from './utils'
import settings from './settings';
import { AdvectElement } from './AdvectElement';
import { AdvectView } from './AdvectView';
import './style.css'
import * as Comlink from 'comlink';

const parser = new DOMParser();
/**
 * Given a template element build a custom element from it
 * @param template the template to build the custom element from
 * @param register whether to register the custom element
 * @returns the custom element
 */
export async function build(_template: HTMLTemplateElement | string, register = true) {
  let template: HTMLTemplateElement | null = null;
  let doc : Document;
  if (typeof _template == "string") {
    doc = parser.parseFromString(_template, "text/html");
    template = doc.querySelector('template') as HTMLTemplateElement;
  }
  else {
    template = _template;
    doc = parser.parseFromString(template.outerHTML, "text/html");
  }

  // shadow mode can be open or closed we prefer open
  const shadow_mode = template.getAttribute('shadow-mode') ?? settings.default_shadow_mode;
  // use internals can be true or false
  // const use_internals = template.getAttribute('use-internals') == "true" || settings.default_use_internals;
  // get all the attributes except core to add to observedAttributes
  const attrs = [...template.attributes].filter(
    attr => attr.name != 'adv' // no need to copy the adv attribute
      && attr.name != 'id' //switching ids is a bad idea
      && attr.name != 'shadow-mode' // not sure id want this switching
      && attr.name != 'use-internals' // not sure id want this switching
  );
  // get the main module expects a default export of a class that extends AdvectElement
  let mainModule = null;
  // only take 1 script and treat it as a module
  const mainScript = template.content.querySelector('script[type="module"]');
  if (mainScript && mainScript.textContent) {
    template.content.removeChild(mainScript);
    mainModule = await toModule(mainScript.textContent);
  }
  // Other scripts to add to the context
  const dataScripts = [...(doc.querySelector('template')?.content.querySelectorAll('script:not([type="module"])') ?? [])]
    .map(script => { 
      return { id : script.id, script: script.textContent as string }
    });
  // used so refs can be used in scope script before the template is rendered
  const refs_ids = [...template.content.querySelectorAll('[id]')].map(el => el.id);
  // NOT USED BUT COULD BE
  const slots_names = [...template.content.querySelectorAll('slot')].map(el => el.name);
  // Bring it all home
  // create a template class that extends the main module or AdvectElement
  // add all othe data to the class
  const TemplateClass = class extends (mainModule?.default ?? class extends AdvectElement { }){
    // Document created from the template, not sure if this is useful but hey its here
    $doc: Document = doc;
    // the template element
    $template: HTMLTemplateElement = template as HTMLTemplateElement;
    // all of the refs of the initial template
    $ref_ids: string[] = refs_ids;
    // all of the slots of the initial template
    $slots_names: string[] = slots_names;
    $data_scripts = dataScripts;
    static $shadow_mode = shadow_mode;
    // observe alll the attributes
    static observedAttributes = attrs.map(attr => attr.name.toLocaleLowerCase());
  };

  if (register) {
    // @ts-ignore valid custom element name
    customElements.define(template.id, TemplateClass);
  }
  return TemplateClass;
}

let loaded:string[] = []

/**
 * Load a template from a url and add creates custom elements from the templates
 * @param url url to load
 * @param method method to use
 * @param headers additional headers to add
 * @returns promise to that resolves when the template is built
 */
export async function load(
  url: string,
  method: 'GET' | 'POST' | 'PATCH' = 'GET',
  headers: Record<string, string> = {
    "Content-Type": "text/html",
    accept: "text/html",
  }) {

    if (loaded.includes(url)) {
      console.warn(`Template from ${url} already loaded`);
      return;
    }
    loaded.push(url);
  return fetch(url, {
    method,
    headers
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`Could not fetch template from ${url}`);
      }
      return { 
        text: await res.text(),
        res
      }})
    .then(({text}) => {
      const doc = parser.parseFromString(text, "text/html");
      // chain load other advect components
      // @ts-ignore
      [...doc.querySelectorAll("template[id]")].forEach((_template: Node) => {
        const template = _template as HTMLTemplateElement;
        if (customElements.get(template.id)) {
          console.warn(`Template with id ${template.id} already exists`);
          return;
        }
        // TODO maybe make upgrading components a thing
        const existingCustomElement = customElements.get(template.id);
        if (existingCustomElement) {
          console.warn(`Template with id ${template.id} already exists`);
          return;
        }
        if (template.tagName.toLocaleLowerCase() != "template") {
          console.error("Template tag must be a template tag");
          return;
        }
     //   console.log("Adding template", template.id);
        build(template);
      });

      const src_scripts = doc.querySelectorAll(`script[type='${settings.script_tag_type}']`);
      src_scripts.forEach((script) => {
        const src = script.getAttribute("src");
        if (src) { load(src); }
      });
    })
    .catch((e) => {
      console.error(`Could not parse template from request`, e);
    });
}




export class AdvMutationEvent extends CustomEvent<MutationRecord>{
  constructor(mutation: MutationRecord){
    super("adv:mutation", {
      bubbles: false,
      composed: true,
      cancelable: false,
      detail: mutation
    });
  }
}




  // register all templates with adv attribute
  document.querySelectorAll(`template[id][${settings.load_tag_type}]`).forEach((template) => {

    build(template as HTMLTemplateElement);
  });
  document.querySelectorAll(`script[type="${settings.script_tag_type}"][src]`).forEach((script) => {
    const src = script.getAttribute("src");
    if (src) { load(src); }
  });


export function plugin(){}



customElements.define("adv-view", AdvectView);

// const worker = new SharedWorker("./advect.worker.js" );
// const worker_handle = Comlink.wrap(worker.port);
// // @ts-ignore
// worker_handle.init().then((res) => {
//   console.log(res)
// });
