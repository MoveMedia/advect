import type { AstroBuiltinAttributes } from "astro"

export interface DocPage {
    name:string,
    index:number
}
export const docPages = Object
    .values(await import.meta.glob("../pages/docs/*.astro", { eager:true })) as {
        pageInfo:DocPage,
        default: Function,
        file:string
        url:string
    }[]