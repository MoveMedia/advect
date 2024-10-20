import { Edge } from "edge.js";
import * as app from "@/services/directus/app";
import edjsHTML  from 'editorjs-html'
import Elysia, { Context } from "elysia";
import { setup, tw } from 'twind'
import { virtualSheet, getStyleTag,  } from 'twind/sheets'
import theme from "@/views/twind.config";
// edge setup 
const edge = Edge.create({ cache: process.env.NODE_ENV === "production" });
const BASE_URL = new URL("./", import.meta.url);
edge.mount(new URL("./", BASE_URL));


const globals = await app.getSingleton<app.Globals>("Globals")

// EditorJS setup
const editorjsParser = edjsHTML()
export function edjs (htmlJson:any) {
    return editorjsParser.parse(htmlJson)
}

// HTMLRewriter setup for twind
const sheet = virtualSheet()
setup({ sheet, mode: 'silent', theme })
sheet.reset()

const rewriter = new HTMLRewriter();
rewriter.on("*[class]", {
    element(e){
        tw(e.getAttribute("class")?.split(" ") ?? [])
    },
})

edge.use((e)=>{
    e.global("globals", globals);
    e.global('app', app )
    e.global('edjs', edjs)
    e.global('templateExists',  async (template_path:string) => {
        const real_path =`${import.meta.dir}/${template_path}.edge`
        const template_file =  Bun.file(real_path)
        const templateExists = await template_file.exists()
        console.log(real_path, templateExists)
        return templateExists
    });
})

export type RenderView = typeof view;
const view = {
    async render( view:string, context : Context, data: any ){
        const domString = await edge.render(view, {ctx:context , ...data})
        rewriter.transform(domString); // calls tw
        const domTwindInjected = domString.replace("</head>", [getStyleTag(sheet),
            "</head>"].join("\n"))
        return domTwindInjected
    }
}

// Twind setup
export default new Elysia<"view">().decorate("view", view)

