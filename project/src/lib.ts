import { type HTMLNodeInterface } from "./HTMLNode"

export type AttrTypeKey = keyof typeof  AttrTypes
export type AttrType = typeof AttrTypes
const AttrTypes = {
    number:{},
    string:{},
    bigint:{},
    color:{},
}

export type FormatTypeKey = keyof typeof FormatTypes
export type FormatType = typeof FormatTypes
const FormatTypes = {
    none:{},
    rgb:{},
    rgba:{},
    hsla:{},
    hex:{}
}


export interface CustomElementSettings{
    tagName:string,
    module: string,
    template:string,
    templateNode:HTMLNodeInterface |null,
    refs: HTMLNodeInterface[],
    shadow: 'open' | 'closed',
    root: 'light' | 'shadow'
    watched_attrs: {
        [key:string]: {
            type: AttrTypeKey
           // format?: FormatType
           // storage: 'css-var' | 'store'
        }
    },
    mutation?: {
        attributes?: boolean,
        characterData?: boolean,
        childList?: boolean,
        subtree?: boolean,
        attributeFilter?: string[]
    },
    intersection:{
        margin?: number,
        threshhold?:number,
        root?:string
    }
    logs:string[]

}

export function isValidAttrType( attr:string ) {
    return Object.keys(AttrTypes).find( t => t.toLowerCase() == attr.toLocaleLowerCase() ) != null
}


export const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;

export function toModule(script: string, inject: string[]) {
    const encoded_uri =
      "data:text/javascript;charset=utf-8," +
      inject.join("\n") +
      encodeURIComponent(`${script}`);
    return import(/* @vite-ignore */ encoded_uri)
      .then((module) => module)
      .catch((err) => {
        console.error(err);
        return null;
      });
  }
