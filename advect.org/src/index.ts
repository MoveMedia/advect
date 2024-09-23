import { Elysia, t } from "elysia";
import Home from "@/views/pages";
import Auth from "@/views/pages/auth";
import Editor from "@/views/pages/editor";
import Docs from "@/views/pages/docs";
import Renderer from "@/views/renderer"


const app = new Elysia()
  .use(Renderer)
  .use(Home)
  .use(Auth)
  .use(Editor)
  .use(Docs)
  .get("/assets/*", ({ set, error, params }) => {
    return Bun.file("./assets/" + params["*"]);
  })
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
