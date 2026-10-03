import { Hono } from "hono";
import { serveStatic } from "hono/bun";

const app = new Hono();


app.get(
  "/*",
  serveStatic({
    root: "./static",
     precompressed: true,
    mimes: {
      js: "text/javascript",
      css: "text/css",
      ico: "image/x-icon",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      svg: "image/svg+xml",
      woff: "font/woff",
      woff2: "font/woff2",
      ttf: "font/ttf",
      eot: "application/vnd.ms-fontobject",
      html: "text/html",
    },
  }),
);

app.get("/editor/:id", (c) => {
  const id = c.req.param('id')
  return c.text('editor')
});




export default app;
