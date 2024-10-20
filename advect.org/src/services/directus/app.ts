import { createDirectus, rest, registerUser,login, authentication, readItems, aggregate, readItem, readSingleton, readRelation, readRelations, RelationalFields } from '@directus/sdk';
import { injectDataIntoContent } from "directus-extension-flexible-editor/content";
import { JSONContent } from '@tiptap/core/src/types';

if (!process.env.DIRECTUS_URL) {
    throw new Error('DIRECTUS_URL is not defined');
}
const client = createDirectus<Schema>(process.env.DIRECTUS_URL).with(rest()).with(authentication())

export interface Globals {
    site_name:string;
    site_version:string;
    site_tagline:string
}
export interface Page {
    title:string;
    description:string;
    featured_image:string;
    editor_nodes: Record<string, any>[];
    content: JSONContent;
}
export interface AdvectComponent{
    title:string;
    description:string;
    code?:string;
    example?:string;
    docs?:string;
}
export interface Schema {
    Global:Globals
    Pages: Page[]
    AdvectComponents: AdvectComponent[]
}

export const countItems = async (collection:string) => {
    return await client.request( aggregate(collection as any, {
        aggregate: { count: '*' },
    }) ).then((res) => parseInt(res[0].count ?? '0'))
    .catch((e) => {
        console.log(`Directus Error: Collection ${collection}:`, e)
        return -1
    });
}

export const getSingleton = async <T>(collection:string) =>{
    return await client.request(readSingleton(collection as any,{
        fields:["*"]

    })).catch( e => {
        return null;
    }) 
}

export const queryItems = async <T>(
    collection:string, 
    load:boolean = false, 
    limit:number = 100, 
    page:number = 1,
    filter:any = {},
    sort:string[] = []
    ) => {
    const count = await countItems(collection);
    const pages = Math.ceil(count / limit);
    let results:T[] = [];
    if (load) {
        results = await client.request(
            readItems(collection as any, {
                fields: ['*'],
                limit,
                page,
                filter,
                sort,
                
            })
        );
    }
    return {
        count,
        pages,
        results,
    };
}

export const queryItem = async <T>(
    collection:string, 
    filter:any = {},
    sort:string[] = []

) => {
    return queryItems<T>(collection, true, 1, 1, filter, sort).then((res) => res.results[0]);
}

export const getItemsByIds = async <T>(collection:string, ids:string[]) => {
    return queryItems<T>(collection, true, ids.length, 1, { id: { _in: ids } }).then((res) => res.results);
}
export const getItemById = async <T>(collection:string, id:string) => {
    return await client.request(readItem(collection as any, id)).then((res) => res as T);
}


export const getAllItems = async <T>(collection:string, fields = ["*"]) => {
    const result = await client.request(
        readItems(collection as any, {
            fields,
        })
    );
    return result as T[];
}



export const getRelation = async <T>(collection:string, field:string) => {
    return await client.request(readRelation(collection, field));
}
export const getRelations = async <T>(collection:string, field:string) => {
    return  await client.request(readRelations());
}
const signUp = async (email:string, pass:string) => {
    const result = await client.request(registerUser(email, pass)).catch((e) => {
        console.log(e)
    });
    return result
    
}
const signIn = async (email:string, pass:string) => {
    const result =  await client.request(login(email, pass, {}));
    return result;
}



export {
    client,
    signUp,
    signIn,
    injectDataIntoContent
}