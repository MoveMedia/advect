import { AdvectPlugin } from "./plugins";
import { $window } from "./utils";

export type AdvectSettings = typeof defaultSettings;
const defaultSettings = {
    default_shadow_mode: "open" as const,
    // this tag is used to load additional scripts
    script_tag_type: "text/adv" as const,
    // this tag needs to be added to individual template elements to be compiled, not reqired for templates loaded with script_tag_type
    load_tag_type: "adv" as const,
    // this tag tells to engine to skip compiling the tag
    adv_skip: "adv-skip" as const,
     // list of tags that should not be send and onload event
    refs_no_inital_load: ["frame", "iframe", "img", "input[type='image']", "link", "script", "style"] as const,
    default_renderer: "sqrl" as const,
    include_twind: true as const,
    shim:{
        useShim: true as const,
        selector: null as string | null,
        once: true as const,
    },
    plugins: [] as AdvectPlugin[],

} as const;

const settings = new Proxy(defaultSettings, {
    get: (target:AdvectSettings & Record<string, any>, prop:string) => {
        if (!$window.adv_settings){
            return target[prop];
        }
        return $window.adv_settings?.[prop] ?? target[prop];
    }
});

export default settings;
