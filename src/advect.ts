import { $window, toModule} from './utils'
import settings from './settings';

import './style.css'
import { PluginSystem } from './plugins';
import mustachePlugin from './plugins/mustache.plugin';
import twindPlugin from './plugins/twind.plugin';


const parser = new DOMParser();

export default class Advect {

    plugins = new PluginSystem();
    globals:Record<string, any> = [];
    async load(
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
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`Could not fetch template from ${url}`);
                }
                return res

            })
            .then(async (res) =>
            ({
                text: await res.text(),
                res
            }))
            .then(({ text }) => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, "text/html");
                // chain load other advect components

                [...doc.querySelectorAll("template[id]")].forEach((_template: Node) => {
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
                    this.build(template);
                });

                const src_scripts = doc.querySelectorAll(`script[type='${settings.script_tag_type}']`);
                src_scripts.forEach((script) => {
                    const src = script.getAttribute("src");
                    if (src) { this.load(src); }
                });
                
            })
            .catch((e) => {
                console.error(`Could not parse template from request`, e);
            });
    }
    async build(_template: HTMLTemplateElement | string, register = true) {
        let template: HTMLTemplateElement | null = null;
        let doc: Document;
        if (typeof _template == "string") {
            doc = parser.parseFromString(_template, "text/html");
            template = doc.querySelector('template') as HTMLTemplateElement;
        }
        else {
            template = _template;
            doc = parser.parseFromString(template.outerHTML, "text/html");
        }

        doc = this.plugins.loaded(doc);

        // shadow mode can be open or closed we prefer open
        const shadow_mode = template.getAttribute('shadow-mode') ?? settings.default_shadow_mode;
        // use internals can be true or false
        //const use_internals = template.getAttribute('use-internals') == "true" || settings.default_use_internals;
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
        const mainScript = template.content.querySelector('script[type="module"]');
        if (mainScript && mainScript.textContent) {
            template.content.removeChild(mainScript);
            mainModule = await toModule(mainScript.textContent);
        }
        // Other scripts to add to the context
        // e
        const dataScripts = [...(doc.querySelector('template')?.content.querySelectorAll('script:not([type="module"])') ?? [])]
            .map(script => {
                return { id: script.id, script: script.textContent as string }
            });

        const refs_ids = [...template.content.querySelectorAll('[id]')].map(el => el.id);
        // NOT USED BUT COULD BE
        const slots_names = [...template.content.querySelectorAll('slot')].map(el => el.name);

        const TemplateClass = class extends (mainModule?.default ?? class extends AdvectElement { }) {
            $doc: Document = doc;
            $ref_ids: string[] = refs_ids;
            $slots_names: string[] = slots_names;
            $template: HTMLTemplateElement = template as HTMLTemplateElement;
            static $shadow_mode = shadow_mode;
            data_scripts = dataScripts;
            static observedAttributes = attrs.map(attr => attr.name.toLocaleLowerCase());
        };

        const PostPlugin = this.plugins.built(TemplateClass);

        // TODO plugins.ontemplate_build

        if (register) {
            // @ts-ignore valid custom element name
            customElements.define(template.id, PostPlugin);
        }
        return TemplateClass;
    }

    start() {
        // register all templates with adv attribute
        document.querySelectorAll(`template[id][${settings.load_tag_type}]`).forEach((template) => {
            this.build(template as HTMLTemplateElement);
        });


        document.querySelectorAll(`script[type="${settings.script_tag_type}"][src]`).forEach((script) => {
            const src = script.getAttribute("src");
            if (src) { this.load(src); }
        });
    }

}

const adv = $window.advect = new Advect();
adv.plugins.addPlugin(markdownPlugin);
adv.plugins.addPlugin(mustachePlugin);
adv.plugins.addPlugin(twindPlugin);



import { AdvectElement } from './AdvectElement';
import { AdvectView } from './AdvectView';
import markdownPlugin from './plugins/markdown.plugin';

adv.start();


customElements.define("adv-view", AdvectView);
customElements.define("adv-el", AdvectElement);




