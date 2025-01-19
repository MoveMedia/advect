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
  adv_log
} from "./lib";


/**
 * List of actions available in advect
 */
export const Actions = {
  async prerender(renderDesc: {
    template: string;
    state: Record<string, any>;
  }): Promise<string> {
    adv_log({ renderDesc });
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
    adv_log({
      message: "starting my loading",
      urls,
    });
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
      adv_log({
        msg: "wow loading some stuff",
        url,
        data,
      });
      settingResults.push(...data);
    }

    adv_log({
      message: "done loading",
      urls,
    });

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
    const root_nodes = HTMLNode.create(String.raw`${template}`);
    const results: CustomElementSettings[] = [];

    adv_log({
      message: "building",
      template,
      root_nodes,
    });

    for (let root_node of root_nodes) {
      adv_log({
        message: "Adding",
        root_node: root_node.attributes.id,
      });

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
          adv_log(
            "advect Template must have an id that will become the tag name"
          );
          continue;
        }
        const tagName = root_node.attributes["id"];
        if (tagName.indexOf("-") === -1) {
          adv_log("advect Template tag name must contain a hyphen");
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
          const node = childQueue.shift();
          if (!node) continue;
          if (node.tagName === "settings") {
            node.children.forEach((child: HTMLNodeInterface) => {
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
            node.remove();
          } // can be a
          if (node.tagName === "script") {
            // can be a
            if (
              node.attributes["type"].toLocaleLowerCase() === "text/adv" &&
              node.attributes["type"]
            ) {
              const url = new URL(node.attributes["src"]);
              this.load({ urls: url.toString() });
            }
            if (
              node.attributes["type"].toLocaleLowerCase() === "module" &&
              !node.attributes["src"]
            ) {
              settings.module = node.text();
            }
          }

          if (node.attributes["ref"]) {
            settings.refs.push(node);
          }

          childQueue.push(...node.children);
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
