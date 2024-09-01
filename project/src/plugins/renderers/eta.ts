import { AdvectView } from "../../AdvectView";
import { $window, RenderDescriptor } from "../../utils";
import { Eta } from "eta"



export default function ({ template, ctx, view }:RenderDescriptor) {
    if (!ctx) return "";
    const fields = Object.keys(ctx);
    ctx.___fields = fields;
    ctx.___hasFields = fields.length - 1 > 0;

    const clean = cleanTemplate(template);
    let rendered = "";
    try {
      // add the view to the view in main context
      rendered = (view as AdvectView & { eta:Eta })?.eta.renderString(clean, ctx);
      return rendered;
    } catch (e) {
      const str = JSON.stringify((e as Error).stack);
      $window.test = str;
      if (str.includes("    at each (") && str.includes("563:31")) {
        // that wieird error that happens when you use each
        console.log('that wierd error that happens when you use each');
      } else {
        console.error(e, ctx, view);
      }
    }
    return rendered;
  }

 


  function cleanTemplate(template: string) {
    const unescaped = convertEscapedChars(template);
    const _if = convertIfElse(unescaped);
    const _for = convertFor(_if);
    const _of = convertOf(_for);
    //console.log(_of);
    return _of;
  }



    function convertEscapedChars(template: string) {
        return template
        .replace(/&gt;/g, ">")
        .replace(/&lt;/g, "<")
        .replace(/&amp;/g, "&");
    }

    function convertIfElse(template: string) {
        return template
          .replace(/<if check="([^"]+)">/g, "{{ if ( $1 ) { }}")
          .replace(/<else\/?>/g, "{{ } else { }}")
          .replace(/<\/if>/g, "{{ } }}");
      }


      function convertFor(template: string) {
        return template
          .replace(
            /<for data="([^"]+)"(?: name="([^"]+)")?(?: index="([^"]+)")?>/g,
            function (_, data, name, index) {
              if (name && index) {
                return `{{ ${data}.forEach(function(${name}, ${index}){ }}`;
              } else if (name) {
                return `{{ ${data}.forEach(function(${name}){ }}`;
              } else {
                return `{{ ${data}.forEach(function(){ }}`;
              }
            }
          )
          .replace(/<\/for>/g, "{{ }) }}");
      }


      function convertOf(template: string) {
        return template
          .replace(
            /<of data="([^"]+)"(?: name="([^"]+)")?(?: value="([^"]+)")?>/g,
            function (_, data, name, value) {
              if (name && value) {
                return `{{ Object.keys(${data}).forEach(function(${name}) { }} 
                    {{ const ${value} = ${data}[${name}] }}
                `;
              } else if (name) {
                return `{{ Object.keys(${data}).forEach(function(${name}) { }}`;
              } else {
                return `{{ Object.keys(${data}).forEach(function() { }}`;
              }
            }
          )
          .replace(/<\/of>/g, "{{ }) }}");
      }
      