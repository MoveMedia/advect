import { Edge } from "edge.js";
import Elysia, { error, redirect } from "elysia";
import edge from "@/views/renderer";
import html from "@elysiajs/html";
import { AdvectComponent, queryItem } from "@/services/directus/app";
import {generateGuid} from "@/lib";

export default new Elysia().group("/editor", (editor) => {
  return editor
    .use(html())
    .get("/", async (ctx) => {
      return redirect(`/editor/${generateGuid()}`);
    })
    .get("/:id", async (ctx) => {
        const componetId = ctx?.params?.id;
        return await queryItem<AdvectComponent>(
          "AdvectComponents",
          componetId
        ).then(async (adv_component) => {
          return await edge.render("pages/editor/index", { ctx, adv_component });
        })
        .catch(async (e) => {
          return await edge.render("pages/editor/index", { ctx, adv_component: {}, error: e });
        });

    })
    .post("/:id", async (ctx) => {});
});
