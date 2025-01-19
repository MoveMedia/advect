import { expect, test,  } from "bun:test";

import { HTMLNode, type HTMLNodeInterface } from "../HTMLNode";
import { Actions } from "../advect.actions";

import lightDomBasic from "./components/light-dom-basic.html" with { type: "text" };  
import shadowDomBasic from "./components/shadow-dom-basic.html" with { type: "text" };  

/**
 * Test that basic component is a valid component
 * with default settings for root, and shadow
 */
test("light-dom-basic", async () => {
    const componentSettings = await Actions.build({
        template: lightDomBasic
    });
    expect(componentSettings.length).toBe(1);
    const onlyComponent = componentSettings[0];
    expect(onlyComponent.tagName).toBe("light-dom-basic");
    expect(onlyComponent.root).toBe("light");
    expect(onlyComponent.shadow).toBe("closed");
});

/**
 * Test that basic component is a valid component
 * with "root" set to "shadow" and shadow set to open
 */
test("shadow-dom-basic", async () => {
  const componentSettings =  await Actions.build({
      template: shadowDomBasic
  });
  expect(componentSettings.length).toBe(1);
  const onlyComponent = componentSettings[0];
  expect(onlyComponent.tagName).toBe("shadow-dom-basic");
  expect(onlyComponent.root).toBe("shadow");
  expect(onlyComponent.shadow).toBe("open");
});