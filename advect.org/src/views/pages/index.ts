import Elysia, { Context, error } from "elysia";
import edge from "@/views/renderer";
import html from "@elysiajs/html";
import { Edge } from "edge.js";

export default new Elysia()
  .use(html())
  .get("/", async (ctx: Context & { edge: Edge}) => {
      return await ctx.edge.render("pages/home", { ctx })
      .catch( async (e) => {
        return await ctx.edge.render("pages/error", { ctx, error: e });
      });
  })
  .get("/404", async (ctx: Context & { edge: Edge}) => {
    ctx.set.status = 404;
    return await ctx?.edge.render("pages/404", { ctx });
  });
