import type { MatchedRoute } from "bun";
import type { RouteView } from "../../lib";


export default async function AssetResponse(req: Request, route: MatchedRoute): Promise<RouteView> {
    // finds a file in the "public" directory
    return {
        handle: handle
    }
}

export async function handle (req: Request, res: Response, route: MatchedRoute) {

    if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });

    const ext = route.pathname.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'css':
            res.headers.set('content-type', 'text/css');
            break;
        case 'js':
            res.headers.set('content-type', 'application/javascript');
            break;
        case 'html':
            res.headers.set('content-type', 'text/html');
            break;
        case 'json':
            res.headers.set('content-type', 'application/json');
            break;    
        
        case 'svg':
            res.headers.set('content-type', 'image/svg+xml');
            break;
        case 'xml':
            res.headers.set('content-type', 'application/xml');
            break;
        case 'png':
            res.headers.set('content-type', 'image/png');
            break;
        case 'jpg':
        case 'jpeg':
            res.headers.set('content-type', 'image/jpeg');
            break;
        case 'gif':
            res.headers.set('content-type', 'image/gif');
            break;
        case 'webp':
            res.headers.set('content-type', 'image/webp');
            break;
        case 'ico':
            res.headers.set('content-type', 'image/x-icon');
            break;
        case 'pdf':
            res.headers.set('content-type', 'application/pdf');
            break;
        case 'wav':
            res.headers.set('content-type', 'audio/wav');
            break;
        case 'mp3':
            res.headers.set('content-type', 'audio/mpeg');
            break;
        case 'mp4':
            res.headers.set('content-type', 'video/mp4');
            break;
        case 'webm':
            res.headers.set('content-type', 'video/webm');
            break;
        case 'woff':
            res.headers.set('content-type', 'font/woff');
            break;
        case 'woff2':
            res.headers.set('content-type', 'font/woff2');
            break;
        case 'ttf':
            res.headers.set('content-type', 'font/ttf');
            break;
        case 'otf':
            res.headers.set('content-type', 'font/otf');
            break;
        case 'eot':
            res.headers.set('content-type', 'font/eot');
            break;
        case 'txt':
            res.headers.set('content-type', 'text/plain');
            break;
        
        default:
            res.headers.set('content-type', '*/*');
            break;
        
    }

    const file = Bun.file('.' + route.pathname);
    if (!file) {
        return new Response('Not Found', { status: 404 });
    }

   return new Response(file, { headers: res.headers });
}