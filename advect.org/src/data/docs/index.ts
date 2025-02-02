import type { AstroBuiltinAttributes } from "astro"
import type { Page, SitePage } from "../SitePage"

export interface DocPage extends Page {}
const _docPages = 
    Object.values(await import.meta.glob("./**/*.astro", { eager:true, exhaustive:true  })) as SitePage<DocPage>[]

export const docPages = _docPages.sort((a, b) => {
    return a.pageInfo.index - b.pageInfo.index;
  });
  
