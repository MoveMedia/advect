import { AdvectView } from "../AdvectView";
import { AdvectPlugin } from "../plugins";
import snarkdown from "snarkdown";
import { create, cssomSheet } from "twind";
import AdvectBase from "../AdvectBase";
// @ts-ignore
import { $window } from "../utils";
import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import { setup, disconnect } from "twind/shim";
import settings from "../settings";
import eta from "./renderers/eta";
import { Eta } from "eta";
import md from "./renderers/md";


// Render a template

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
    if (el.nodeName === "ADV-VIEW") {
      (el as AdvectView & {eta:Eta}).eta = new Eta( {
        tags: [el.getAttribute("openTag") ?? "{{", el.getAttribute("closeTag") ?? "}}"],
      });
    }
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
    md,
    eta,
  },
};


export default advectCorePlugin;
