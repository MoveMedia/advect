import type { Page, SitePage } from "../SitePage"

export interface BlogPage extends Page {
    blurb?:string,
    featured_img?:string
    readtime?:string
    published?:Date;
}
export const blogPages = Object
    .values(await import.meta.glob("./**/*.astro", { eager:true })) as SitePage<BlogPage>[]
