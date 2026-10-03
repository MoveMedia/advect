import { test, expect, beforeAll } from "bun:test";
import { installDom } from "./setup";

let cweSettingsFromString: (html: string, baseUrl?: string) => any[];
let parseStaticImports: (source: string) => any[];
let collectTopLevelNames: (source: string) => string[];

beforeAll(async () => {
  installDom();
  const mod = await import("../src/advect");
  cweSettingsFromString = mod.cweSettingsFromString;
  parseStaticImports = mod.parseStaticImports;
  collectTopLevelNames = mod.collectTopLevelNames;
});

test("reads a top-level <script setup> and style as siblings of the template", () => {
  const settings = cweSettingsFromString(
    `<template advect="x-card" root="shadow"><span>{{ state.a }}</span></template>
     <script setup>const count = 1;</script>
     <style>.a{color:red}</style>`,
    "http://localhost/x.vue"
  );
  expect(settings.length).toBe(1);
  expect(settings[0].tagName).toBe("x-card");
  expect(settings[0].module).toContain("$$$context");
  expect(settings[0].module).toContain("return { count }");
  expect(settings[0].style).toContain("color:red");
  expect(settings[0].sourceUrl).toBe("http://localhost/x.vue");
});

test("injects element context into the setup wrapper, excluding declared names", () => {
  const settings = cweSettingsFromString(
    `<template advect="ctx-card"></template>
     <script setup>
       const state = { data: 1 };
       $state.ready = true;
     </script>`
  )[0];
  expect(settings.module).toContain("let $state = $$$context['$state']");
  expect(settings.module).toContain("let $refs = $$$context['$refs']");
  expect(settings.module).not.toContain("let state = $$$context['state']");
  expect(settings.module).toContain("return { state }");
});

test("extracts and strips component imports from the setup script", () => {
  const settings = cweSettingsFromString(
    `<template advect="y-card"></template>
     <script setup>
       import "./child.vue";
       import { helper } from "./util.js";
       const value = helper();
     </script>`
  )[0];
  expect(settings.imports).toEqual(["./child.vue"]);
  expect(settings.module).not.toContain("./child.vue");
  expect(settings.module).toContain("./util.js");
});

test("renders @import rules as a style node and keeps rules in the sheet", () => {
  const settings = cweSettingsFromString(
    `<template advect="z-card"></template>
     <style>.b{color:blue}</style>
     <style>@import "a.css"; .a{color:red}</style>`
  )[0];
  expect(settings.style).not.toContain("@import");
  expect(settings.style).toContain(".b{color:blue}");
  expect(settings.style).toContain(".a{color:red}");
  const styleNode = (settings.layout as HTMLElement).querySelector("style");
  expect(styleNode).not.toBeNull();
  expect(styleNode!.textContent).toContain('@import "a.css"');
});

test("enforces a single component per file", () => {
  const settings = cweSettingsFromString(
    `<template advect="a-a"></template><template advect="b-b"></template>`
  );
  expect(settings).toEqual([]);
});

test("collectTopLevelNames finds top-level and destructured declarations", () => {
  const names = collectTopLevelNames(`
    import "./x.js";
    const a = 1, b = 2;
    let { c, d: e } = obj;
    const [f, ...rest] = list;
    function onConnect() {}
    class Thing {}
    async function load() { const hidden = 1; }
    const fn = () => { const nested = 1; };
  `);
  expect(names).toContain("a");
  expect(names).toContain("b");
  expect(names).toContain("c");
  expect(names).toContain("e");
  expect(names).toContain("f");
  expect(names).toContain("rest");
  expect(names).toContain("onConnect");
  expect(names).toContain("Thing");
  expect(names).toContain("load");
  expect(names).toContain("fn");
  expect(names).not.toContain("hidden");
  expect(names).not.toContain("nested");
  expect(names).not.toContain("d");
});

test("parseStaticImports handles multi-line, dynamic and meta imports", () => {
  const parsed = parseStaticImports(
    `import {\n  a,\n  b\n} from "./x.js";\nconst p = import("./dyn.js");\nimport.meta.url;`
  );
  expect(parsed.map((p: any) => p.specifier)).toEqual(["./x.js"]);
});
