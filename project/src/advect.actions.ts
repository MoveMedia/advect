/**
 * Ok sparky heres the deal.
 * This file contains all of the actions advect can use on a worker no browser access.
 */

import { set } from "lodash";
import { HTMLNode } from "./advect.HTMLNode";
import AdvectLog from "./advect.log";
import {
  type AttrTypeKey,
  type CustomElementSettings,
  isValidAttrType,
  AdvectSettings,
} from "./lib";

/**
 * List of actions available in advect
 */
export const Actions = {
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
    //const cleanTemplate = stripHtmlComments(template);
    const root_nodes = HTMLNode.create(String.raw`${template}`);
    const results: CustomElementSettings[] = [];

    for (let root_node of root_nodes) {
      if (root_node.tagName.toLowerCase() === "template") {
        if (!root_node.attributes[AdvectSettings.attributes.template]) {
          AdvectLog.log.warn(
            "advect Template must have an advect that will become the tag name"
          );
          continue;
        }
        const settings: CustomElementSettings = {
          tagName: "",
          module: "",
          template: "",
          templateNode: null,
          refs: [],
          root: "light",
          shadow: "closed",
          watched: {},
          logs: [],
          layout: null,
          layoutNodes: [],
          style: "",
        };
        const tagName =
          root_node.attributes[AdvectSettings.attributes.template];

        if (tagName.indexOf("-") === -1) {
          AdvectLog.log.warn("advect Template tag name must contain a hyphen");
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
          const template_root_child =
            currNode.parent?.tagName.toLocaleLowerCase() == "template";

          if (template_root_child) {
            if (currNode.tagName === AdvectSettings.tags.settings) {
              currNode.children.forEach((child: HTMLNode) => {
                if (
                  child.tagName == AdvectSettings.tags.options &&
                  child.attributes["name"]
                ) {
                  const name = child.attributes["name"];
                  let type = child.attributes?.["type"] ?? "string";
                  if (type == "") type = "string";
                  const format = child.attributes?.["format"] ?? "none";
                  const defaultValue = child.attributes?.["value"] ?? "";

                  // const _set = child.attributes?.["set"] ?? "attribute";

                  const hasValidType = isValidAttrType(type);

                  if (hasValidType) {
                    settings.watched[name] = {
                      type: type as AttrTypeKey,
                      format,
                      defaultValue,
                    };
                  }
                }
              });
            } // can be a
            if (currNode.tagName === "script") {
              if (
                currNode.attributes["type"]?.toLocaleLowerCase() === "module" &&
                !currNode.attributes["src"]
              ) {
                settings.module = currNode.text();
              }
            }
            if (
              currNode.tagName.toLocaleLowerCase() ===
              AdvectSettings.tags.layout
            ) {
              settings.layout = currNode.children.map((c) => c.html()).join("");
              settings.layoutNodes = currNode.children;
            }
            if (currNode.tagName.toLocaleLowerCase() === "style") {
              settings.style = currNode.text();
            }
          }

          if (currNode.attributes["ref"]) {
            settings.refs.push(currNode);
          }
          childQueue.push(...currNode.children);
        }
        const outerHtml = String.raw`${template}`;

        settings.template = outerHtml;
        results.push(settings);
      }
      // load dependant compmponents
      if (
        root_node.tagName.toLowerCase() == "script" &&
        root_node.attributes["rel"] &&
        root_node.attributes["type"] == "application/html"
      ) {
        this.load({ urls: root_node.attributes["rel"] });
      }
    }
    return results;
  },
};
export type ActionKey = keyof typeof Actions;
