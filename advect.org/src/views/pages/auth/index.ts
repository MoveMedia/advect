import { Edge } from "edge.js";
import Elysia, { Context, Cookie, redirect, t } from "elysia";
import edge from "@/views/renderer";
import { signIn, signUp } from "@/services/directus/app";
import html from "@elysiajs/html";
import { SiteContext } from "@/lib";

export default new Elysia()
  .group("/auth", (auth) => {
    return auth
    .use(html())
      .get("/", () => "Hi")
      .get("/sign-up", async (ctx: SiteContext) => {
        return await ctx.view.render("pages/auth/sign-up", ctx, {})
      })
      .post(
        "/sign-up",
        async (context) => {
          const errors = new Map<string, string[]>();

          if (context.body.accept_marketing) {
          }

          const passwordMatch =
            context.body.password === context.body.password_confirmation;
          if (!passwordMatch) {
            errors.set("password", ["Passwords do not match"]);
          }

          const emailIsUnique = true;
          if (!emailIsUnique) {
            errors.set("email", ["Email is already in use"]);
          }

          const phoneIsUnique = true;
          if (!phoneIsUnique) {
            errors.set("phone", ["Phone number is already in use"]);
          }
          if (errors.size > 0) {
            context.set.status = 422;
            return { errors: errors };
          }
          context.set.status = 200;
          
          await signUp(context.body.email, context.body.password);
          const token = "user-key"
          return {
            token
          };
        },
        {
          body: t.Object({
            first_name: t.String(),
            last_name: t.String(),
            accept_marketing: t.Boolean(),
            phone: t.String({
              pattern: "^[0-9]{10}$",
            }),
            email: t.String({
              format: "email",
            }),
            password: t?.String({
              minLength: 8,
              maxLength: 40,
              pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])",
            }),
            password_confirmation: t.String(),
          }),
        }
      )
      .get("/sign-in", async (ctx: SiteContext) => {
        ctx.set.headers["Content-Type"] = "text/html";
        return await ctx.view.render("pages/auth/sign-in",ctx, {});
      })
      .post("/sign-in",async ({ body, query, cookie }) => {
        const returnUrl = query.return_url || "/";
        const result = await signIn(body.email, body.password);
        return result;
      }, {
       
        body: t.Object({
          email: t.String({
            format: "email",
          }),
          password: t.String({
            minLength: 8,
            maxLength: 40,
            pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])",
          }),
        }),
      })
          // @ts-ignore
    .onError(async (ctx: SiteContext) => {
      return await ctx.view.render("pages/error", ctx, {});
  });

  });
