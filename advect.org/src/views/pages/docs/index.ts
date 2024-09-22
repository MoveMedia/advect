import { Edge } from "edge.js";
import Elysia, { Context } from "elysia";
import edge from "@/views/renderer";
import html from "@elysiajs/html";
import { queryItem } from "@/services/directus/app";
import pages from "..";


export default new Elysia()
.use(html())
.get("/docs", async (ctx: Context & { edge: Edge}) => {
   // context.set.headers["Content-Type"] = "text/html";
   return await queryItem("Pages", { slug : "/" }).then(async (page) => {
      return await ctx.edge.render("pages/docs/home", { ctx, page });
   })
   .catch(async (e) => {
      return await ctx.edge.render("pages/docs/home", { ctx, pages: {}, error: e });

   });
  });
