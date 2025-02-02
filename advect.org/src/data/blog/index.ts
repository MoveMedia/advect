import type { Page, SitePage } from "../SitePage"

export interface BlogPage extends Page {
    blurb?:string
}
export const blogPages = Object
    .values(await import.meta.glob("./**/*.astro", { eager:true })) as SitePage<BlogPage>[]
