
import { Glob } from "bun";
import type { BunFile } from "bun";
// @ts-ignore
import indexPagePath from "./www/index.html" with { type: "file" };
const indexPageContent = Bun.file(indexPagePath);
import { readdir } from "node:fs/promises"; 


console.log('now running bun.run.ts');

const www_dir = "www";
const www_dir_rel = "./www";

const wwwFiles = await readdir(www_dir_rel, { recursive: true }).then((files) => files.map((f) => `${www_dir_rel}/${f}`));
async function fileExists(path: string|BunFile): Promise<boolean> {

    if (typeof path === 'string') {
        return wwwFiles.find((f) => f === `${path}`) !== undefined
        || Bun.file(path).exists();
    }
    return path.exists();
}

async function getResourceText(pathname: string){
    let data:string|null|BunFile = null;
    let error:Error | any | null = null;
    try{
        const file = Bun.file(`${www_dir_rel}\\${pathname}`);
        if((await fileExists(file))){
            data = file;
        }else{
            throw new Error(`File not found: ${pathname}`,{ cause: 404 });
        }
    }
    catch(e){
        error = e;
    }
    return [data, error]
}

const fs = require('fs').promises;
const path = require('path');

async function copyFiles(srcDir:string, destDir:string) {
    try {
        const files = await fs.readdir(srcDir);
        for (let file of files) {
            const srcFile = path.join(srcDir, file);
            const destFile = path.join(destDir, file);
            await fs.copyFile(srcFile, destFile);
        }
        console.log("Files copied successfully!");
    } catch (error) {
        console.error(`Error in copying files: ${error}`);
    }
}


copyFiles('./dist', './www');



Bun.serve({
    fetch: async (request, server) =>{
        const url = new URL(request.url);
        if(url.pathname === '/'){
            return new Response(indexPageContent, { 
                'status': 200 ,
                'headers': {
                    'Content-Type': 'text/html'
                }
            });
        }

        const [data, error] = await getResourceText(url.pathname);

        if(error){
            return new Response(error.message, { 
                'status': error.cause,
                'headers': {
                    'Content-Type': 'text/plain'
                }
            });
        }

        function getContentType(pathname: string){
            const ext = pathname.split('.').pop();
            switch(ext){
                case 'html':
                    return 'text/html';
                case 'js':
                    return 'application/javascript';
                case 'css':
                    return 'text/css';
                case 'json':
                    return 'application/json';
                case 'png':
                    return 'image/png';
                case 'jpg':
                    return 'image/jpeg';
                case 'jpeg':
                    return 'image/jpeg';
                case 'svg':
                    return 'image/svg+xml';
                case 'ico':
                    return 'image/x-icon';
                case 'txt':
                    return 'text/plain';
                default:
                    return 'application/octet-stream';
            }
        }

        return new Response(await data.text(), { 
            'status': 200 ,
            'headers': {
                'Content-Type': getContentType(url.pathname)
            }
        });
       
    },

})