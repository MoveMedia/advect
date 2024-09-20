
import { Edge } from "edge.js";
import * as app from "@/services/directus/app";
import edjsHTML  from 'editorjs-html'

const edge = Edge.create({ cache: process.env.NODE_ENV === "production"});
const BASE_URL = new URL("./", import.meta.url);
edge.mount(new URL("./", BASE_URL));


const editorjsParser = edjsHTML()
export function edjs (htmlJson:any) {
    return editorjsParser.parse(htmlJson)
}

edge.use((e, runFirst)=>{
    e.global("config", { });
    e.global('app', app )
    e.global('edjs', edjs) 

})

export default edge;