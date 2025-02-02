export interface BlogPage {
    name:string,
    index:number,
    hide?:boolean,
    blurb?:string
    slug:string
}
export const blogPages = Object
    .values(await import.meta.glob("./**/*.astro", { eager:true })) as {
        pageInfo:BlogPage,
        default: Function,
        file:string
        url:string
    }[]

export type BlogPages = typeof blogPages