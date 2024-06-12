import { toModule, toStyle } from './utils'
import settings from './settings';
import { AdvectElement } from './AdvectElement';
import { AdvectView } from './AdvectView';
import './style.css'


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

  // shadow mode can be open or closed
  const shadow_mode = template.getAttribute('shadow-mode') ?? settings.default_shadow_mode;
  // use internals can be true or false
  const use_internals = template.getAttribute('use-internals') == "true" || settings.default_use_internals;
  // get all the attributes except core to add to observedAttributes
  const attrs = [...template.attributes].filter(
    attr => attr.name != 'adv' // no need to copy the adv attribute
      && attr.name != 'id' //switching ids is a bad idea
      && attr.name != 'shadow-mode' // not sure id want this switching
      && attr.name != 'use-internals' // not sure id want this switching
  );
  // get the main module expects a default export of a class that extends window.AdvectElement
  let mainModule = null;
  // only take 1 script and treat it as a module
  const mainScript = template.content.querySelector('script[main]');
  if (mainScript && mainScript.textContent) {
    template.content.removeChild(mainScript);
    mainModule = await toModule(mainScript.textContent);
  }
  // Other scripts to add to the context
  // e
  const dataScripts = [...(doc.querySelector('template')?.content.querySelectorAll('script:not([main])') ?? [])]
    .map(script => { 
      return { id : script.id, script: script.textContent as string }
    });

  const style_els = [...(doc.querySelector('template')?.content.querySelectorAll('style') ?? [])]
  const all_css = style_els.map(style => style.textContent).join('\n');
  const style_sheet = toStyle(all_css);
 // styles.forEach(style => template.content.removeChild(style));
  const refs_ids = [...template.content.querySelectorAll('[id]')].map(el => el.id);
  // NOT USED BUT COULD BE
  const slots_names = [...template.content.querySelectorAll('slot')].map(el => el.name);

  const TemplateClass = class extends (mainModule?.default ?? class extends AdvectElement { }){
    $doc: Document = doc;
    $ref_ids: string[] = refs_ids;
    $slots_names: string[] = slots_names;
    $template: HTMLTemplateElement = template as HTMLTemplateElement;
    $style = style_sheet;
    static $use_internals = use_internals;
    static $shadow_mode = shadow_mode;
    static $data_scripts = dataScripts;
    static observedAttributes = attrs.map(attr => attr.name.toLocaleLowerCase());

  };

  if (register) {
    // @ts-ignore valid custom element name
    customElements.define(template.id, TemplateClass);
  }
  return TemplateClass;
}


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
  return fetch(url, {
    method,
    headers
  })
    .then((res) => res.text())
    .then((text) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      const src_scripts = doc.querySelectorAll(`script[type='${settings.script_tag_type}']`);
      src_scripts.forEach((script) => {
        const src = script.getAttribute("src");
        if (src) { load(src); }
      });
      [...doc.querySelectorAll("template[id][adv]")].forEach((_template: Node) => {
        const template = _template as HTMLTemplateElement;
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
    })
    .catch((e) => {
      console.error(`Could not parse template from request`, e);
    });
}


document.addEventListener("DOMContentLoaded", () => {
  // register all templates with adv attribute
  document.querySelectorAll(`template[id][${settings.load_tag_type}]`).forEach((template) => {
    build(template as HTMLTemplateElement);
  });
  document.querySelectorAll(`script[type="${settings.script_tag_type}"][src]`).forEach((script) => {
    const src = script.getAttribute("src");
    if (src) { load(src); }
  });

});


customElements.define("adv-view", AdvectView);
