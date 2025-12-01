/**
 * Ok sparky heres the deal.
 * This file contains all of the actions advect can use on a worker no browser access.
 */

import { HTMLNode } from "./advect.HTMLNode";
import {
  type AttrTypeKey,
  type CustomElementSettings,
  isValidAttrType,
  toModule,
  adv_log,
  adv_warn,
  stripHtmlComments,
  advect_keys
} from "./lib";



/**
 * List of actions available in advect
 */
export const Actions = {
  async prerender(renderDesc: {
    template: string;
    state: Record<string, any>;
  }): Promise<string> {
    return "";
  },
  /**
   * Given a URL 
   * @param param0 
   * @returns a list of custom element settings
   */
  async load({
    urls,
  }: {
    urls: string | string[];
  }): Promise<CustomElementSettings[]> {
 
    const settingResults: CustomElementSettings[] = [];
    const _urls: string[] = [];

    if (Array.isArray(urls)) {
      _urls.push(...urls);
    }
    if (typeof urls == "string") {
      _urls.push(urls);
    }

    for (let url of _urls) {
      const data = await fetch(url)
        .then((r) => r.text())
        .then(async (t) => await Actions.build({ template: t }));
      settingResults.push(...data);
    }



    return settingResults;
  },
  /**
   * 
   * @param param0 
   * @returns 
   */
  async build({
    template,
  }: {
    template: string;
  }): Promise<CustomElementSettings[]> {
    const cleanTemplate = stripHtmlComments(template);
    const root_nodes = HTMLNode.create(String.raw`${cleanTemplate}`);
    const results: CustomElementSettings[] = [];

    for (let root_node of root_nodes) {
      const settings: CustomElementSettings = {
        tagName: "",
        module: "",
        template: "",
        templateNode: null,
        refs: [],
        root: "light",
        shadow: "closed",
        watched_attrs: {},
        props: {},
        logs: [],
        layout: null
      };
      if (root_node.tagName.toLowerCase() === "template") {
        if (!root_node.attributes[advect_keys.template_attr]) {
          adv_warn(
            "advect Template must have an advect that will become the tag name"
          );
          continue;
        }
        const tagName = root_node.attributes[advect_keys.template_attr];
        
        if (tagName.indexOf("-") === -1) {
          adv_warn("advect Template tag name must contain a hyphen");
          continue;
        }

        settings.tagName = tagName;
        settings.templateNode = root_node;
        
        if (root_node.attributes["root"]) {
          settings.root = root_node.attributes["root"] as any;
          // TODO check for the real val
        } else {
          settings.root = "light";
        }

        if (root_node.attributes["shadow"]) {
          settings.shadow = root_node.attributes["shadow"] as any;
          // TODO check for the real val
        } else {
          settings.shadow = "closed";
        }


        const childQueue = [...root_node.children];
        while (childQueue.length > 0) {
          const currNode = childQueue.shift();
          if (!currNode) continue;
          const is_root_child = currNode.parent?.tagName.toLocaleLowerCase() == 'template'

          
          if (currNode.tagName ===  advect_keys.settings && is_root_child) {
            currNode.children.forEach((child: HTMLNode) => {
              if (child.tagName == advect_keys.attrs && child.attributes["name"]) {
                const name = child.attributes["name"];
                const type = child.attributes["type"] ?? "string";
                //const format = child.attributes['format'] ?? 'none';
                if (isValidAttrType(type)) {
                  settings.watched_attrs[name] = {
                    type: type as AttrTypeKey,
                  };
                }
              }
              
            });
          } // can be a
          if (currNode.tagName === "script" && is_root_child) {
            if (
              currNode.attributes["type"]?.toLocaleLowerCase() === "module" &&
              !currNode.attributes["src"]
            ) {
              settings.module = currNode.text();
            }
          }

          if (currNode.tagName.toLocaleLowerCase() === 'layout' && is_root_child){
            settings.layout = currNode.children.map( c => c.html()).join('')
          }

          if (currNode.attributes["ref"]) {
            settings.refs.push(currNode);
          }
          childQueue.push(...currNode.children);
        }
      }
      const outerHtml = root_node.children
        .map((node: HTMLNode) => node.html())
        .join("");

      settings.template = outerHtml;
      results.push(settings);
    }
    return results;
  },
};
export type ActionKey = keyof typeof Actions;
