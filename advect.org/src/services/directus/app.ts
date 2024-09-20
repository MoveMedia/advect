import { createDirectus, rest, registerUser,login, authentication, readItems, aggregate, readItem } from '@directus/sdk';

if (!process.env.DIRECTUS_URL) {
    throw new Error('DIRECTUS_URL is not defined');
}
const client = createDirectus<Schema>(process.env.DIRECTUS_URL).with(rest()).with(authentication())

export interface Page {}
export interface AdvectComponent{}
export interface Schema {
    SiteSettings:{
        title:string
        description:string
        logo:string
    }
    Pages: Page[]
    AdvectComponents: AdvectComponent[]
}

export const countItems = async (collection:string) => {
    return await client.request( aggregate(collection as any, {
        aggregate: { count: '*' },
    }) ).then((res) => parseInt(res[0].count ?? '0'))
    .catch((e) => {
        console.log(e)
        return 0
    });
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
    signIn
}