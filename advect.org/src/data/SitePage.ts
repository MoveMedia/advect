

export interface Page {
    name:string,
    index:number,
    hide?:boolean,
    slug:string
}

export interface SitePage <T extends Page>{
        pageInfo:T,
        default: Function,
        file:string
        url:string
}