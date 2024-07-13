import { create, cssomSheet } from "twind";
import AdvectBase from "../AdvectBase";
import { AdvectPlugin } from "../plugins";
import { AdvectView } from "../AdvectView";

const twindPlugin: AdvectPlugin & Record<string, any> = {
    priorityOrAfter: 0,
    priority: 0,
    name: "twind",
    // only called for AdvectBase descendants
    connected(el: AdvectBase) {
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
    },

    mutated(el: AdvectBase, mutation: MutationRecord) {
        // @ts-ignore
        if (mutation.attributeName === "class" && mutation.target === el) {
            el?.extras?.tw_render()
        }
        if (!(mutation.target as HTMLElement).matches("[no-tw]")) {
            el?.extras?.tw_render()
        }
    },
    rendered(el: AdvectView) {
        el?.extras?.tw_render()
    },

}


export default twindPlugin;