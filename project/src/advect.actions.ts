/**
 * Ok sparky heres the deal.
 * This file contains all of the actions advect can use on a worker no browser access
 */

import { HTMLNode, type HTMLNodeInterface } from "./HTMLNode";
import {
  type AttrTypeKey,
  type CustomElementSettings,
  isValidAttrType,
  toModule,
  adv_log,
  adv_warn,
  stripHtmlComments
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
        .then(async (t) => await this.build({ template: t }));
   
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
        mutation: {
          attributeFilter: [],
          attributes: true,
          characterData: false,
          childList: true,
          subtree: true,
        },
        intersection: {
          margin: 0.5,
          threshhold: 1,
        },
        logs: [],
      };
      if (root_node.tagName.toLowerCase() === "template") {
        if (!root_node.attributes["id"]) {
          adv_warn(
            "advect Template must have an id that will become the tag name"
          );
          continue;
        }
        const tagName = root_node.attributes["id"];
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
          if (currNode.tagName === "settings") {
            currNode.children.forEach((child: HTMLNodeInterface) => {
              if (child.tagName == "mutation") {
                if (
                  settings?.mutation?.attributeFilter &&
                  child.attributes["attributeFilter"]
                ) {
                  settings.mutation.attributeFilter =
                    child.attributes["attributeFilter"].split(",");
                }
                if (
                  settings?.mutation?.attributes &&
                  child.attributes["attributes"]
                ) {
                  settings.mutation.attributes =
                    child.attributes["attributes"]
                      .toLocaleLowerCase()
                      .indexOf("true") != -1;
                }
                if (
                  settings?.mutation?.characterData &&
                  child.attributes["characterData"]
                ) {
                  settings.mutation.characterData =
                    child.attributes["characterData"]
                      .toLocaleLowerCase()
                      .indexOf("true") != -1;
                }
                if (
                  settings?.mutation?.childList &&
                  child.attributes["childList"]
                ) {
                  settings.mutation.childList =
                    child.attributes["childList"]
                      .toLocaleLowerCase()
                      .indexOf("true") != -1;
                }
                if (
                  settings?.mutation?.subtree &&
                  child.attributes["subtree"]
                ) {
                  settings.mutation.subtree =
                    child.attributes["subtree"]
                      .toLocaleLowerCase()
                      .indexOf("true") != -1;
                }
              }
              if (child.tagName == "intersection") {
                if (settings?.intersection && child.attributes["margin"]) {
                  settings.intersection.margin = parseFloat(
                    child.attributes["margin"]
                  );
                }
                if (
                  settings?.intersection.threshhold &&
                  child.attributes["threshhold"]
                ) {
                  settings.intersection.threshhold = parseFloat(
                    child.attributes["threshhold"]
                  );
                }
                if (settings?.intersection.root && child.attributes["root"]) {
                  settings.intersection.root = child.attributes["root"];
                }
              }
              if (child.tagName == "attr" && child.attributes["name"]) {
                const name = child.attributes["name"];
                const type = child.attributes["type"] ?? "string";
                //const format = child.attributes['format'] ?? 'none';
                if (isValidAttrType(type)) {
                  settings.watched_attrs[name] = {
                    type: type as AttrTypeKey,
                  };
                }
              }
              child.remove();
            });
            currNode.remove();
          } // can be a
          if (currNode.tagName === "script") {
            // can be a
            if (
              currNode.attributes["type"]?.toLocaleLowerCase() === "text/adv" &&
              currNode.attributes["type"]
            ) {
              const url = new URL(currNode.attributes["src"]);
              this.load({ urls: url.toString() });
            }
            if (
              currNode.attributes["type"]?.toLocaleLowerCase() === "module" &&
              !currNode.attributes["src"]
            ) {
              settings.module = currNode.text();
            }
          }

          if (currNode.attributes["ref"]) {
            settings.refs.push(currNode);
          }

          childQueue.push(...currNode.children);
        }
      }
      const outerHtml = root_node.children
        .map((node: HTMLNodeInterface) => node.html())
        .join("");

      settings.template = outerHtml;
      results.push(settings);
    }
    return results;
  },
};

export type ActionKey = keyof typeof Actions;
