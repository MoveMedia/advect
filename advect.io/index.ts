import type { MatchedRoute } from "bun";
import ReactDOMServer from "react-dom/server";
import type { RouteView } from "./lib";
 

const router = new Bun.FileSystemRouter({
    style: "nextjs",
    dir: "./pages",
    origin: Bun.env.ORIGIN,
    assetPrefix: "_next/static/"
  });
Bun.serve({
    fetch(req) {

        const match = router.match(req);
        console.log('Matched Route: ', match);
        if (match) {
            return RouteResponse(req, match);
        }
        return new Response('Not Found', { status: 404 });

    },
  });

  export async function RouteResponse(req: Request, route: MatchedRoute): Promise<Response> {
    try {
        const module = await import(route.filePath);
        const {view, handle} = await module.default(req, route) as RouteView;

        const resp = await Promise.resolve( view ? ReactDOMServer.renderToString(view) : 'no view')
            .then((txt) => 
                view 
                    ? new Response(txt)
                    : new Response())
            .then((resp) => handle ? handle(req, resp, route) : resp);

        return resp
    }
    catch (e) {
        console.log(e, 'errors my guy')
        return new Response('Error: ' + e, { status: 500 });
    }
}
    
