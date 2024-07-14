import mustache from "mustache";
import { AdvectView } from "../AdvectView";
import { AdvectPlugin } from "../plugins";
import snarkdown from 'snarkdown';
const markdownPlugin: AdvectPlugin = {
    priorityOrAfter: 0,
    priority: 0,
    name: "markdown",
    renderer(el:AdvectView, template_str, data, _) {
        const fields = Object.keys(data);
        data.fields = fields;
        data.hasFields = fields.length - 1 > 0;

        const open_tag = el.getAttribute('open-tag')?.valueOf() ?? '{{';
        const close_tag = el.getAttribute('close-tag')?.valueOf() ?? '}}';
        
        const rendered = mustache.render(template_str, data, {}, [open_tag, close_tag]);

        const parsed = rendered.split('\n').map((line, i) => {
            // remove leading whitespace, newlines, and tabs
            line = line.replace(/^\s+/, '');
            // remove trailing whitespace, newlines, and tabs
            line = line.replace(/\s+$/, '');
            return line;
        }).join('\n');

        return snarkdown(parsed);
    }
}

export default markdownPlugin;