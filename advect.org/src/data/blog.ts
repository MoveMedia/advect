export interface BlogPage {
    name:string,
    index:number,
    hide?:boolean,
    blurb?:string
}
export const blogPages = Object
    .values(await import.meta.glob("../pages/blog/**/*.astro", { eager:true })) as {
        pageInfo:BlogPage,
        default: Function,
        file:string
        url:string
    }[]

export type BlogPages = typeof blogPages