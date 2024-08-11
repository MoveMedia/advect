import { AdvectView } from "../AdvectView";
import { AdvectPlugin } from "../plugins";
import snarkdown from "snarkdown";
import { create, cssomSheet } from "twind";
import AdvectBase from "../AdvectBase";
import * as sqrl from "squirrelly";
import { $window } from "../utils";
import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import { setup, disconnect } from "twind/shim";
import settings from "../settings";

const advectCorePlugin: AdvectPlugin = {
  priorityOrAfter: 0,
  priority: 0,
  name: "advect.core",
  template_built(templateClass) {
    // add zustand store to the class`
    templateClass.prototype.createStore = createStore;
    templateClass.prototype.useStore = useStore;

    templateClass.$Style = new CSSStyleSheet();

    return templateClass;
  },
  plugin_init() {
    AdvectView.$Style = new CSSStyleSheet();
    if (settings.shim.useShim) {
      if ($window?.advect?.globals && !$window?.advect?.globals["twind"]) {
        $window.advect.globals["twind"] = { setup, disconnect };
      }
      setup({
        // node element to shim/observe (default: document.documentElement)
        target:
        settings?.shim?.selector && settings?.shim?.selector?.length > 0
            ? (document.querySelector(settings.shim.selector) as HTMLElement)
            : document.documentElement,
        // All other setup options are supported
      });

      if (settings.shim.once) {
        disconnect();
      }
    }
  },
  component_connected(el: AdvectBase) {
    const sheet = cssomSheet({ target: el.$style });
    const { tw } = create({ sheet });
    const render = () => {
      tw(el.className);
      el.shadowRoot?.querySelectorAll("[class]").forEach((_el) => {
        tw(_el.className);
      });
      el.querySelectorAll("[class]").forEach((_el) => {
        tw(_el.className);
      });
    };
    el.extras.twind = {
      sheet,
      tw,
      render,
    };
    el.extras.twind.render();
  },
  component_mutated(el: AdvectBase, mutation: MutationRecord) {
    // @ts-ignore
    if (mutation.attributeName === "class" && mutation.target === el) {
      el?.extras?.twind?.render();
    }
    // @ts-ignore
    if (mutation.target.matches &&
      !(mutation.target as HTMLElement)?.matches("[no-tw]")
    ) {
      el?.extras?.twind?.render();
    }
  },
  view_rendered(el: AdvectView) {
    el?.extras?.twind?.render();
  },
  renderers: {
    markdown: function ({ template, ctx }) {
      ctx = ctx ?? {};
      const fields = Object.keys(ctx);
      ctx.___fields = fields;
      ctx.___hasFields = fields.length - 1 > 0;
      const rendered = sqrl.render(template, ctx) as string;
      const parsed = rendered
        .split("\n")
        .map((line) => {
          // remove leading whitespace, newlines, and tabs
          line = line.replace(/^\s+/, "");
          // remove trailing whitespace, newlines, and tabs
          line = line.replace(/\s+$/, "");
          return line;
        })
        .join("\n");

      return snarkdown(parsed);
    },
    sqrl: function ({ template, ctx }) {
      if (!ctx) return "";
      const fields = Object.keys(ctx);
      ctx.___fields = fields;
      ctx.___hasFields = fields.length - 1 > 0;

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
        } else {
          console.error(e);
        }
      }
      return rendered;
    },
  },
};

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

/**
 * Converts <if> and <else> elements to Squirrelly template tags
 * @param {string} template - The template string containing virtual DOM elements
 * @returns {string} - The template string with Squirrelly template tags
 *
 * Example:
 * convertIfElse('<if check="options.someval === \'someothervalue\'"><else/></if>');
 * // Outputs: "{{@if(options.someval === 'someothervalue')}}{{#else}}{{/if}}"
 */
function convertIfElse(template: string) {
  return template
    .replace(/<if check="([^"]+)">/g, "{{@if($1)}}")
    .replace(/<else\/?>/g, "{{#else}}")
    .replace(/<\/if>/g, "{{/if}}");
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
function convertFor(template: string) {
  return template
    .replace(
      /<for data="([^"]+)"(?: name="([^"]+)")?(?: index="([^"]+)")?>/g,
      function (_, data, name, index) {
        if (name && index) {
          return `{{@each(${data}) => ${name}, ${index}}}`;
        } else if (name) {
          return `{{@each(${data}) => ${name}}}`;
        } else {
          return `{{@each(${data})}}`;
        }
      }
    )
    .replace(/<\/for>/g, "{{/each}}");
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
function convertOf(template: string) {
  return template
    .replace(
      /<of data="([^"]+)"(?: name="([^"]+)")?(?: value="([^"]+)")?>/g,
      function (_, data, name, index) {
        if (name && index) {
          return `{{@foreach(${data}) => ${name}, ${index}}}`;
        } else if (name) {
          return `{{@foreach(${data}) => ${name}}}`;
        } else {
          return `{{@foreach(${data})}}`;
        }
      }
    )
    .replace(/<\/of>/g, "{{/foreach}}");
}

export default advectCorePlugin;
