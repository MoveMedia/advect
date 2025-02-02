import type { AstroBuiltinAttributes } from "astro"

export interface DocPage {
    name:string,
    index:number,
    hide?:boolean,
    slug:string
}
const _docPages = 
    Object.values(await import.meta.glob("./**/*.astro", { eager:true, exhaustive:true  })) as {
        pageInfo:DocPage,
        default: Function,
        file:string
        url:string
    }[]

export const docPages = _docPages.sort((a, b) => {
    return a.pageInfo.index - b.pageInfo.index;
  });
  


export type DocPages = typeof docPages