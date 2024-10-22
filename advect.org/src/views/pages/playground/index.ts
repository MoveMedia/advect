import { Edge } from "edge.js";
import Elysia, { Context, error, redirect } from "elysia";
import edge from "@/views/renderer";
import html from "@elysiajs/html";
import {generateGuid, SiteContext} from "@/lib";

export default new Elysia().group("/playground", (editor) => {
  return editor
    .use(html())
    .get("/", async (ctx: SiteContext) => {
      return redirect(`/playground/${generateGuid()}`);
    })
    .get("/:id", async (ctx: SiteContext) => {
      return await ctx.view.render("pages/playground/index",  ctx, { });
    })
    .post("/:id", async (ctx) => {})
     // @ts-ignore
  .onError(async (ctx: SiteContext) => {
    return await ctx.view.render("pages/error", ctx, { });
  });
;
});
