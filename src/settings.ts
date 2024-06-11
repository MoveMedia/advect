export default {
    // this tag is used to load additional scripts
    script_tag_type: "text/adv" as const,
    // this tag needs to be added to individual template elements to be compiled
    load_tag_type: "adv" as const,

    adv_skip: "adv-skip" as const,

    load_event: "adv:load" as const,

    default_shadow_mode: "open" as const,
    default_use_internals: true as const,

} as const