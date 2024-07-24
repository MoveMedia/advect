import { AdvectView } from "../AdvectView";
import { AdvectPlugin } from "../plugins";
import snarkdown from 'snarkdown';
import { create, cssomSheet } from "twind";
import AdvectBase from "../AdvectBase";
import * as sqrl from 'squirrelly'
import { $window } from "../utils";



const advectCorePlugin: AdvectPlugin = {
    priorityOrAfter: 0,
    priority: 0,
    name: "advect.core",
    component_connected(el: AdvectBase) {
        const sheet = cssomSheet({ target: el.$style })
        const { tw } = create({ sheet });
        el.extras.tw_render = () =>{
          
            tw(el.className)
            el.shadowRoot?.querySelectorAll('[class]').forEach(_el => {
                tw(_el.className)
            })
            el.querySelectorAll('[class]').forEach(_el => {
                tw(_el.className)
            })
        }
        el.extras.tw_render()
    },
    component_mutated(el: AdvectBase, mutation: MutationRecord) {
        // @ts-ignore
        if (mutation.attributeName === "class" && mutation.target === el) {
            el?.extras?.tw_render()
        }
        // @ts-ignore
        if (mutation.target.matches && !(mutation.target as HTMLElement)?.matches("[no-tw]")) {
            el?.extras?.tw_render()
        }
    },
    view_rendered(el: AdvectView) {
        el?.extras?.tw_render()
    },
    // ref_found(ref: HTMLElement) {

    // },

    // component_connected(el: AdvectBase) {

    // },

    // component_mutated(el: AdvectBase, mutation: MutationRecord) {

    // },
    // view_rendered(el: AdvectView) {

    // },
    renderers: {
        "markdown": function ({ template, ctx }) {
            ctx = ctx ?? {};
            const fields = Object.keys(ctx);
            ctx.___fields = fields;
            ctx.___hasFields = fields.length - 1 > 0;
            const rendered = sqrl.render(template, ctx) as string;
            const parsed = rendered.split('\n').map((line) => {
                // remove leading whitespace, newlines, and tabs
                line = line.replace(/^\s+/, '');
                // remove trailing whitespace, newlines, and tabs
                line = line.replace(/\s+$/, '');
                return line;
            }).join('\n');

            return snarkdown(parsed);
        },
        "sqrl": function ({ template, ctx }) {
            if (!ctx ) return "";
            const fields = Object.keys(ctx);
            ctx.___fields = fields;
            ctx.___hasFields = fields.length - 1 > 0;
            const clean = template.replace('&gt;', '>').replace('&lt;', '<');   
            let rendered = "";
            try {
                rendered = sqrl.render(clean, ctx);
                return rendered;
            } catch (e) {   
                 const str = JSON.stringify((e as Error).stack);
                 $window.test = str;
                 if (str.includes("    at each (") && str.includes("563:31")) {
                    // that wieird error that happens when you use each
                 }else{
                    console.error(e);
                 }

            }
            return rendered;
           
        }
    },
  

}

export default advectCorePlugin;