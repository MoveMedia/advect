import { RenderDescriptor } from "../../utils";
import { Eta } from "eta";
import { AdvectView } from "../../AdvectView";
import snarkdown from "snarkdown";

export default function ({ template, ctx, view }:RenderDescriptor) {
    ctx = ctx ?? {};
    const fields = Object.keys(ctx);
    ctx.___fields = fields;
    ctx.___hasFields = fields.length - 1 > 0;
    const rendered = (view as AdvectView & { eta:Eta })?.eta.renderString(template, ctx);
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
  }