import { AdvectView } from "../AdvectView";
import { AdvectPlugin } from "../plugins";
import m from "mustache"
const mustachePlugin: AdvectPlugin = {
    priorityOrAfter: 0,
    priority: 0,
    name: "mustache",
    renderer(el:AdvectView, template_str, data, _) {
        const fields = Object.keys(data);
        data.fields = fields;
        data.hasFields = fields.length - 1 > 0;
        const open_tag = el.getAttribute('open-tag')?.valueOf() ?? '{{';
        const close_tag = el.getAttribute('close-tag')?.valueOf() ?? '}}';
        const rendered = m.render(template_str, data, {}, [open_tag, close_tag]);
        return rendered;
    }
}

export default mustachePlugin;