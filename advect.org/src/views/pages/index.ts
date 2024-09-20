import Elysia, { error } from "elysia";
import edge from "@/views/renderer";
import html from "@elysiajs/html";

export default new Elysia()
  .use(html())
  .get("/", async (ctx) => {
      return await edge.render("pages/home", { ctx })
      .catch( async (e) => {
        return await edge.render("pages/error", { ctx, error: e });
      });
  })
  .get("/404", async (ctx) => {
    ctx.set.status = 404;
    return await edge.render("pages/404", { ctx });
  });
