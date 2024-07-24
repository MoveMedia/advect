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
            // const clean = template
            //     .replace('&gt;', '>').replace('&lt;', '<')
            //     ;   
            const clean = cleanTemplate(template);
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


function cleanTemplate(template:string) {
    const clean = template
    .replace('&gt;', '>').replace('&lt;', '<')
    
    const _if = convertIfElse(clean);
    const _for = convertFor(_if);
    const _of = convertOf(_for);

   
    return _of;
}



/**
 * Converts <if> and <else> elements to Squirrelly template tags
 * @param {string} template - The template string containing virtual DOM elements
 * @returns {string} - The template string with Squirrelly template tags
 *
 * Example:
 * convertIfElse('<if check="options.someval === \'someothervalue\'"><else/></if>');
 * // Outputs: "{{@if(options.someval === 'someothervalue')}}{{#else}}{{/if}}"
 */
function convertIfElse(template:string) {
    return template
      .replace(/<if check="([^"]+)">/g, '{{@if($1)}}')
      .replace(/<else\/?>/g, '{{#else}}')
      .replace(/<\/if>/g, '{{/if}}');
  }

  /**
 * Converts <for> elements to Squirrelly template tags
 * @param {string} template - The template string containing virtual DOM elements
 * @returns {string} - The template string with Squirrelly template tags
 *
 * Example:
 * convertFor('<for data="it.todos" name="todo" index="todo_index"></for>');
 * // Outputs: "{{@each(it.todos) => todo, todo_index}}{{/each}}"
 */
function convertFor(template:string) {
    return template.replace(/<for data="([^"]+)"(?: name="([^"]+)")?(?: index="([^"]+)")?>/g, function(_, data, name, index) {
      if (name && index) {
        return `{{@each(${data}) => ${name}, ${index}}}`;
      } else if (name) {
        return `{{@each(${data}) => ${name}}}`;
      } else {
        return `{{@each(${data})}}`;
      }
    }).replace(/<\/for>/g, '{{/each}}');
  }
  
  
/**
 * Converts <of> elements to Squirrelly template tags
 * @param {string} template - The template string containing virtual DOM elements
 * @returns {string} - The template string with Squirrelly template tags
 *
 * Example:
 * convertOf('<of data="options.someObject"></of>');
 * // Outputs: "{{@foreach(options.someObject)}}{{/foreach}}"
 */
function convertOf(template:string) {
    return template.replace(/<of data="([^"]+)">/g, '{{@foreach($1)}}')
                   .replace(/<\/of>/g, '{{/foreach}}');
  }
  




/***
 
    think about your your answer before you responde

  you are using the squirrellyjs renderer to render the templates
  the documentation for a cheat sheet is https://v7--squirrellyjs.netlify.app/docs/v7/cheatsheet
  
  I want you to preparse the template string with virtual dom elements <if>, <else>, <for>, and <of>
  each one corresponds to a squirrelly template tag.
  
DO NOT INCLUDE SAMPLE CODE IN THE RESPONSE 

THE CODE SHOULD WORK FOR optional index and name attributes


  example 1 the if statment
  
  <if check="options.someval === "someothervalue">
       <else/>
  </if>
  
  will output
  
  {{@if(options.someval === "someothervalue")}}
     {{#else}}
  {{/if}}
  
  
  example 2 the for loop
  
  
  <for data="it.todos" name="todo" index="todo_index">
  
  </for>
  
  will output
  
   
 {{@each(it.todos) => todo, todo_index}}
  ...
  {{/each}}
  
  optionally the index, and the name can be omitted
  
  
  
  example 3 the of loop
  
  
  <of data="options">
  </of>
  
  
  will output


  {{@foreach(options.someObject)}}
  {{/foreach}}
  
 
  given these examples write a regex that will replace the virtual dom elements with the corresponding squirrelly template tags
  do not be verbose in your response but do include documentation on the regex in the code
  create 1 function for each virtual tag and include an example in the documentation




 */




export default advectCorePlugin;