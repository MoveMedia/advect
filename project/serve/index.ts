import index from './index.html'
Bun.serve({
    port: 61594,
    routes:{
        "/": index,
        "/components/*": async req => {
            const url = new URL(req.url);
            const file = Bun.file(`${import.meta.dir}/${url.pathname}`)
            if (await file.exists()){
                return new Response(await file.text(),{
                    "Content-Type":'text/html'
                })
            }
            
            return new Response('', {
                status: 404,
                statusText: 'Not Found',
            });
        }
    }
})