import { Edge } from "edge.js";
import Elysia, { Context, error, redirect } from "elysia";
import edge from "@/views/renderer";
import html from "@elysiajs/html";
import { AdvectComponent, queryItem } from "@/services/directus/app";
import {generateGuid} from "@/lib";

export default new Elysia().group("/editor", (editor) => {
  return editor
    .use(html())
    .get("/", async (ctx: SiteContext) => {
      return redirect(`/editor/${generateGuid()}`);
    })
    .get("/:id", async (ctx: SiteContext) => {
      // @ts-ignore
        const componetId = ctx.params.id;
        return await queryItem<AdvectComponent>(
          "AdvectComponents",
          componetId
        ).then(async (adv_component) => {
          return await ctx.view.render("pages/editor/index", { ctx, adv_component });
        })
    })
    .post("/:id", async (ctx) => {})
     // @ts-ignore
  .onError(async (ctx: Context & { edge: Edge }) => {
    return await ctx.view.render("pages/error", { ctx });
  });
;
});
