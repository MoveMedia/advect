import { Edge } from "edge.js";
import Elysia from "elysia";
import edge from "@/views/renderer";
import html from "@elysiajs/html";
import { queryItem } from "@/services/directus/app";
import pages from "..";


export default new Elysia()
.use(html())
.get("/docs", async (ctx) => {
   // context.set.headers["Content-Type"] = "text/html";
   return await queryItem("Pages", { slug : "/" }).then(async (page) => {
      return await edge.render("pages/docs/home", { ctx, page });
   })
   .catch(async (e) => {
      return await edge.render("pages/docs/home", { ctx, pages: {}, error: e });

   });
  });
