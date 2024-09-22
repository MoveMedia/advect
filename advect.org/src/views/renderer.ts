
import { Edge } from "edge.js";
import * as app from "@/services/directus/app";
import edjsHTML  from 'editorjs-html'
import Elysia from "elysia";

const edge = Edge.create({ cache: process.env.NODE_ENV === "production"});
const BASE_URL = new URL("./", import.meta.url);
edge.mount(new URL("./", BASE_URL));

const globals = await app.getSingleton<app.Globals>("Globals")

const editorjsParser = edjsHTML()
export function edjs (htmlJson:any) {
    return editorjsParser.parse(htmlJson)
}

edge.use((e)=>{
    e.global("globals", globals);
    e.global('app', app )
    e.global('edjs', edjs) 

})


export default new Elysia<"edge">()
    .decorate("edge", edge)
