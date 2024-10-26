import Elysia, { Context, error } from "elysia";
import edge from "@/views/renderer";
import html from "@elysiajs/html";
import { SiteContext } from "@/lib";
import * as app from "@/services/directus/app";

export default new Elysia()
  .use(html())
  .get("/", async (ctx: SiteContext) => {
      return await ctx.view.render("pages/home", ctx, { });
  })
  .get("/404", async (ctx: SiteContext) => {
    ctx.set.status = 404;
    return await ctx?.view.render("pages/404", ctx, {});
  })
   // @ts-ignore
   .onError(async (ctx: SiteContext) => {
    return await ctx.view.render("pages/error", ctx, {});
  })
  ;

 