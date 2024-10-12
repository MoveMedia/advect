import { AdvectView } from "../AdvectView";
import { AdvectPlugin } from "../plugins";
import { create, cssomSheet } from "twind";
import AdvectBase from "../AdvectBase";
// @ts-ignore
import { $window } from "../utils";
import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import { setup, disconnect } from "twind/shim";
import config from "../config";
import eta from "./renderers/eta";
import { Eta } from "eta";
import md from "./renderers/md";

const ETA = new Eta({
  tags: ["{{", "}}"],
  useWith: true,
});

$window.debug_refs = [];

// Render a template

const advectCorePlugin: AdvectPlugin = {
  priorityOrAfter: 0,
  priority: 0,
  name: "advect.core",
  template_built(templateClass) {
    // add zustand store to the class`
    // not available on adv-view
    templateClass.prototype.createStore = createStore;
    templateClass.prototype.useStore = useStore;
    templateClass.$Style = new CSSStyleSheet();
    // check if ""
    return templateClass;
  },
  plugin_init() {
    // check if use shim
    // check if the componet is no-tw, or style-target=
    if (config.shim.useShim) {
      if ($window?.advect?.globals && !$window?.advect?.globals["twind"]) {
        const styleSheet = new CSSStyleSheet();
        AdvectView.$Style = styleSheet
        const omSheet = cssomSheet({ target: styleSheet });
        const twindInstance = create({ sheet: omSheet });
        const shim =  { setup, disconnect }
        document.adoptedStyleSheets.push(styleSheet)
        $window.advect.globals["twind"] = {
            styleSheet,
            omSheet,
            twindInstance,
            shim
        };
      }
      setup({
        // node element to shim/observe (default: document.documentElement)
        target:
          config?.shim?.selector && config?.shim?.selector?.length > 0
            ? (document.querySelector(config.shim.selector) as HTMLElement)
            : document.documentElement,

        // All other setup options are supported
      });

      if (config.shim.once) {
        disconnect();
      }
    }else{
      AdvectView.$Style = new CSSStyleSheet();
    }
  },
  component_connected(el: AdvectBase) {
    if (el.nodeName === "ADV-VIEW") {
      (el as AdvectView & { eta: Eta }).eta = ETA;
    }
    if (el.matches('[]'))
    el.mergeStyles([$window?.advect?.globals["twind"].styleSheet])
    
    //const sheet = cssomSheet({ target: el.$style });
   // const { tw } = create({ sheet });
    const tw = $window?.advect?.globals["twind"]?.twindInstance.tw
    const render = () => {
      tw(el.className);
      el.shadowRoot?.querySelectorAll("[class]:not([no-tw])").forEach((_el) => {
        tw(_el.className);
      });
      el.querySelectorAll("[class]:not([no-tw])").forEach((_el) => {
        tw(_el.className);
      });
    };
    el.extras.twind = {
      tw,
      render,
    };
    el.extras.twind.render();
  },
  ref_found(ref, base) {
    $window.debug_refs.push({
      ref,
      base,
    });
  },
  component_mutated(el: AdvectBase, mutation: MutationRecord) {
    // @ts-ignore
    if (mutation.attributeName === "class" && mutation.target === el) {
      el?.extras?.twind?.render();
    }
    if (
    // @ts-ignore
      mutation.target.matches &&
      !(mutation.target as HTMLElement)?.matches("[no-tw]")
    ) {
      el?.extras?.twind?.render();
    }
  },
  view_rendered(el: AdvectView) {
    el?.extras?.twind?.render();
  },
  renderers: {
    md,
    eta,
  },
};

export default advectCorePlugin;
