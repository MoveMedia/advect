import type { MatchedRoute } from "bun";
import type React from "react";


export type RouteView = {
    view?: React.ReactElement;
    handle: (req: Request, res: Response, route: MatchedRoute) => Promise<Response>;
};


export async function AddDocType(resp:Response): Promise<Response> { 
    const doc_type = '<!DOCTYPE html>';
    const text = await resp.text();
    return new Response(doc_type + text, resp);
}

export async function AddHTMLContentType(resp:Response): Promise<Response> { 
    const headers = new Headers(resp.headers);
    headers.set('content-type', 'text/html;charset=UTF-8');
    return new Response(resp.body, { headers });
}
export async function SetExpiry(resp:Response, seconds:number = 0): Promise<Response> { 
    const headers = new Headers(resp.headers);
    headers.set('cache-control', `max-age=${seconds}`);
    return new Response(resp.body, { headers });
}
