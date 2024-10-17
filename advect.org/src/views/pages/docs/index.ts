import { Edge } from "edge.js";
import Elysia, { Context } from "elysia";
import edge from "@/views/renderer";
import html from "@elysiajs/html";
import { queryItem } from "@/services/directus/app";
import pages from "..";
import { SiteContext } from "@/lib";

export default new Elysia()
  .use(html())
  .group("/docs", (docs) => {
    return docs.get("/", async (ctx: SiteContext) => {
      return await ctx.view.render("pages/docs/home", ctx, {});
    });
  }) // @ts-ignore
  .onError(async (ctx: SiteContext) => {
    return await ctx.view.render("pages/error", ctx, {});
  });
