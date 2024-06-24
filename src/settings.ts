export default {
    // this tag is used to load additional scripts
    script_tag_type: "text/adv" as const,
    // this tag needs to be added to individual template elements to be compiled, not reqired for templates loaded with script_tag_type
    load_tag_type: "adv" as const,
    // this tag tells to engine to skip compiling the tag
    adv_skip: "adv-skip" as const,
    //
    load_event: "adv:load" as const,
    // the default shadow mode for the custom elements
    default_shadow_mode: "open" as const,
    // the default use_internals for the custom elements
    default_use_internals: true as const,
     // list of tags that should not be send and onload event
    refs_no_inital_load: ["frame", "iframe", "img", "input[type='image']", "link", "script", "style"] as const,

} as const