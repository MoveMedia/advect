import { CustomElementSettings } from "@advect/advect.lib";

export type AdvectExtensionSettings = ReturnType<typeof createExtensionSettings>;
export function createExtensionSettings(){
	return {
		'component-dirs':[]
	};
}

export type CustomHtmlAttribute = ReturnType<typeof createHtmlCustomAttribute>;
export function createHtmlCustomAttribute(name:string, description:string, values:{ name:string, description:string }[] = []){
	return {
		name,
		description,
		values
	};
}

export type CustomHtmlTag = ReturnType<typeof createHtmlCustomDataTag>;
export function createHtmlCustomDataTag(name:string, description:string,  attributes: CustomHtmlAttribute[]){
	return{
		name,
		description,
		attributes		
	};
}

export type CustomHtmlData = ReturnType<typeof getCustomHtmlData>;
export function getCustomHtmlData(){
	return {
		tags: [] as CustomHtmlTag[],
		globalAttributes: [] as CustomHtmlAttribute[],
		valueSets: [] as CustomHtmlAttribute[]
	};
}

export function CWEtoTag (cwe: CustomElementSettings | CustomElementSettings[] ){
	const cwes = Array.isArray(cwe) ? cwe : [cwe];
	const results = cwes.map( cwe => {
		return {
			name: cwe.tagName,
			description: cwe.tagName,
			attributes: [] as CustomHtmlAttribute[]
		} as CustomHtmlTag;
	});
	return results;
}	