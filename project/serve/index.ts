import index from './index.html'


const mimeTypes = {
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    ttf: 'font/ttf',
    woff: 'font/woff',
    woff2: 'font/woff2',
    eot: 'application/vnd.ms-fontobject',
    otf: 'font/otf',
    pdf: 'application/pdf',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    bz2: 'application/x-bzip2',
}



Bun.serve({
    port: 61594,
    routes:{
        "/": index,
        "/components/*": async req => {
            const url = new URL(req.url);
            const file = Bun.file(`${import.meta.dir}/${url.pathname}`)
            if (await file.exists()){
                const mimeType=  mimeTypes[file.name?.split('.').at(-1)?.toLowerCase()]
                return new Response(await file.text(),{
                    "Content-Type":`${mimeType}`

                })
            }
            
            return new Response('', {
                status: 404,
                statusText: 'Not Found',
            });
        }
    }
})