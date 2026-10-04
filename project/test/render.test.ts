import { test, expect, beforeAll } from "bun:test";
import { installDom } from "./setup";

let AdvectElement: any;
let cweSettingsFromString: (html: string) => any[];

beforeAll(async () => {
  installDom();
  AdvectElement = (await import("../src/advect.element")).AdvectElement;
  cweSettingsFromString = (await import("../src/advect")).cweSettingsFromString;
});

function defineComponent(
  tag: string,
  html: string,
  provider: (ctx: any) => any = () => ({})
) {
  const settings = cweSettingsFromString(html)[0];
  const stylesheet = new (globalThis as any).CSSStyleSheet();
  stylesheet.replace(settings.style ?? "");
  class TestEl extends AdvectElement {}
  (TestEl as any).$settings = settings;
  (TestEl as any).$stylesheet = stylesheet;
  (TestEl as any).$advectVMProvider = function (ctx: any) {
    return provider(ctx);
  };
  (globalThis as any).customElements.define(tag, TestEl);
  return TestEl;
}

function mount(tag: string): any {
  const el = document.createElement(tag);
  document.body.appendChild(el);
  return el;
}

function fire(el: any, type: string) {
  el.dispatchEvent(new Event(type, { bubbles: true }));
}

test("interpolates {{ }} without needing a ref", () => {
  defineComponent(
    "v-interp",
    `<template advect="v-interp" root="shadow" shadow="open">
      <span>{{ state.msg }}</span>
    </template>
    <script type="module">export default () => ({})</script>`,
    ({ state }) => {
      state.msg = "hello";
      return {};
    }
  );
  const el = mount("v-interp");
  expect(el.$shadow.querySelector("span").textContent).toBe("hello");
});

test("binds :attr", () => {
  defineComponent(
    "v-attr",
    `<template advect="v-attr" root="shadow" shadow="open">
      <div :data-x="state.x"></div>
    </template>
    <script type="module">export default () => ({})</script>`,
    ({ state }) => {
      state.x = 42;
      return {};
    }
  );
  const el = mount("v-attr");
  expect(el.$shadow.querySelector("div").getAttribute("data-x")).toBe("42");
});

test("expands v-for with index and :key", () => {
  defineComponent(
    "v-for",
    `<template advect="v-for" root="shadow" shadow="open">
      
        <ul>
          <li v-for="(item, i) in state.items" :key="item"><span>{{ i }}:{{ item }}</span></li>
        </ul>
      
    </template>
    <script type="module">export default () => ({})</script>`,
    ({ state }) => {
      state.items = ["a", "b", "c"];
      return {};
    }
  );
  const el = mount("v-for");
  const items = el.$shadow.querySelectorAll("li");
  expect(items.length).toBe(3);
  expect(items[0].querySelector("span").textContent).toBe("0:a");
  expect(items[2].querySelector("span").textContent).toBe("2:c");
});

test("keyed v-for reuses and reorders nodes", () => {
  defineComponent(
    "v-key",
    `<template advect="v-key" root="shadow" shadow="open">
      
        <ul>
          <li v-for="item in state.items" :key="item.id"><span>{{ item.label }}</span></li>
        </ul>
      
    </template>
    <script type="module">export default () => ({})</script>`,
    ({ state }) => {
      state.items = [
        { id: 1, label: "a" },
        { id: 2, label: "b" },
      ];
      return {};
    }
  );
  const el = mount("v-key");
  const ul = el.$shadow.querySelector("ul");
  const firstA = ul.children[0];
  const elB = ul.children[1];

  el.$state.items = [
    { id: 2, label: "b" },
    { id: 1, label: "a" },
  ];
  el.render();

  expect(ul.children[0]).toBe(elB);
  expect(ul.children[1]).toBe(firstA);
  expect(ul.children[0].querySelector("span").textContent).toBe("b");
});

test("v-if / v-else-if / v-else chain", () => {
  defineComponent(
    "v-if",
    `<template advect="v-if" root="shadow" shadow="open">
      
        <div>
          <span v-if="state.n === 1">one</span>
          <span v-else-if="state.n === 2">two</span>
          <span v-else>other</span>
        </div>
      
    </template>
    <script type="module">export default () => ({})</script>`,
    ({ state }) => {
      state.n = 2;
      return {};
    }
  );
  const el = mount("v-if");
  const div = el.$shadow.querySelector("div");
  expect(div.querySelectorAll("span").length).toBe(1);
  expect(div.querySelector("span").textContent).toBe("two");

  el.$state.n = 3;
  el.render();
  expect(div.querySelector("span").textContent).toBe("other");

  el.$state.n = 1;
  el.render();
  expect(div.querySelector("span").textContent).toBe("one");
});

test("v-show toggles display", () => {
  defineComponent(
    "v-show",
    `<template advect="v-show" root="shadow" shadow="open">
      <p v-show="state.on">hi</p>
    </template>
    <script type="module">export default () => ({})</script>`,
    ({ state }) => {
      state.on = true;
      return {};
    }
  );
  const el = mount("v-show");
  const p = el.$shadow.querySelector("p");
  expect(p.style.display).not.toBe("none");

  el.$state.on = false;
  el.render();
  expect(p.style.display).toBe("none");
  expect(el.$shadow.querySelector("p")).toBe(p);
});

test("v-model on text input", () => {
  defineComponent(
    "v-model",
    `<template advect="v-model" root="shadow" shadow="open">
      <input v-model="state.name" />
    </template>
    <script type="module">export default () => ({})</script>`,
    ({ state }) => {
      state.name = "init";
      return {};
    }
  );
  const el = mount("v-model");
  const input = el.$shadow.querySelector("input");
  expect(input.value).toBe("init");

  input.value = "changed";
  fire(input, "input");
  expect(el.$state.name).toBe("changed");
});

test("v-model checkbox boolean and array", () => {
  defineComponent(
    "v-check",
    `<template advect="v-check" root="shadow" shadow="open">
      
        <input type="checkbox" v-model="state.flag" />
        <input type="checkbox" value="x" v-model="state.picked" />
      
    </template>
    <script type="module">export default () => ({})</script>`,
    ({ state }) => {
      state.flag = false;
      state.picked = [];
      return {};
    }
  );
  const el = mount("v-check");
  const [flag, picked] = el.$shadow.querySelectorAll("input");

  flag.checked = true;
  fire(flag, "change");
  expect(el.$state.flag).toBe(true);

  picked.checked = true;
  fire(picked, "change");
  expect(Array.from(el.$state.picked)).toEqual(["x"]);
});

test("@click handlers and .prevent modifier", () => {
  defineComponent(
    "v-on",
    `<template advect="v-on" root="shadow" shadow="open">
      
        <button @click="state.count++">inc</button>
        <a @click.prevent="state.prevented = true">link</a>
      
    </template>
    <script type="module">export default () => ({})</script>`,
    ({ state }) => {
      state.count = 0;
      state.prevented = false;
      return {};
    }
  );
  const el = mount("v-on");
  const button = el.$shadow.querySelector("button");
  fire(button, "click");
  expect(el.$state.count).toBe(1);

  const link = el.$shadow.querySelector("a");
  const event = new Event("click", { bubbles: true, cancelable: true });
  link.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  expect(el.$state.prevented).toBe(true);
});

test(":class object and :style object", () => {
  defineComponent(
    "v-class",
    `<template advect="v-class" root="shadow" shadow="open">
      
        <div class="base" :class="{ active: state.on }" :style="{ color: state.color }"></div>
      
    </template>
    <script type="module">export default () => ({})</script>`,
    ({ state }) => {
      state.on = true;
      state.color = "red";
      return {};
    }
  );
  const el = mount("v-class");
  const div = el.$shadow.querySelector("div");
  expect(div.getAttribute("class")).toContain("active");
  expect(div.style.color).toBe("red");

  el.$state.on = false;
  el.render();
  expect(div.getAttribute("class") ?? "").not.toContain("active");
});

test("v-html and v-text", () => {
  defineComponent(
    "v-html",
    `<template advect="v-html" root="shadow" shadow="open">
      
        <div v-html="state.raw"></div>
        <p v-text="state.plain"></p>
      
    </template>
    <script type="module">export default () => ({})</script>`,
    ({ state }) => {
      state.raw = "<b>bold</b>";
      state.plain = "<i>not html</i>";
      return {};
    }
  );
  const el = mount("v-html");
  expect(el.$shadow.querySelector("div").innerHTML).toBe("<b>bold</b>");
  expect(el.$shadow.querySelector("p").textContent).toBe("<i>not html</i>");
});

test("<template v-for> renders transparent fragments", () => {
  defineComponent(
    "v-frag",
    `<template advect="v-frag" root="shadow" shadow="open">
      
        <select>
          <template v-for="item in state.items" :key="item">
            <option :value="item">{{ item }}</option>
          </template>
        </select>
      
    </template>
    <script type="module">export default () => ({})</script>`,
    ({ state }) => {
      state.items = ["a", "b"];
      return {};
    }
  );
  const el = mount("v-frag");
  const options = el.$shadow.querySelectorAll("option");
  expect(options.length).toBe(2);
  expect(options[1].value).toBe("b");
});

test("named slot projection via <template #name>", () => {
  defineComponent(
    "v-child",
    `<template advect="v-child" root="shadow" shadow="open">
      <div class="wrap"><slot name="header"></slot></div>
    </template>
    <script type="module">export default () => ({})</script>`
  );
  defineComponent(
    "v-parent",
    `<template advect="v-parent" root="shadow" shadow="open">
      
        <v-child>
          <template v-slot:header><h1>Title</h1></template>
        </v-child>
      
    </template>
    <script type="module">export default () => ({})</script>`
  );
  const el = mount("v-parent");
  const child = el.$shadow.querySelector("v-child");
  const h1 = child.querySelector("h1");
  expect(h1).not.toBeNull();
  expect(h1.getAttribute("slot")).toBe("header");
});

test("v-pre skips compilation", () => {
  defineComponent(
    "v-pre",
    `<template advect="v-pre" root="shadow" shadow="open">
      <div v-pre><span>{{ state.x }}</span></div>
    </template>
    <script type="module">export default () => ({})</script>`,
    ({ state }) => {
      state.x = "nope";
      return {};
    }
  );
  const el = mount("v-pre");
  expect(el.$shadow.querySelector("span").textContent).toBe("{{ state.x }}");
});

test("v-once renders once", () => {
  defineComponent(
    "v-once",
    `<template advect="v-once" root="shadow" shadow="open">
      <span v-once>{{ state.x }}</span>
    </template>
    <script type="module">export default () => ({})</script>`,
    ({ state }) => {
      state.x = "first";
      return {};
    }
  );
  const el = mount("v-once");
  expect(el.$shadow.querySelector("span").textContent).toBe("first");
  el.$state.x = "second";
  el.render();
  expect(el.$shadow.querySelector("span").textContent).toBe("first");
});

test("v-bind object spread", () => {
  defineComponent(
    "v-bindobj",
    `<template advect="v-bindobj" root="shadow" shadow="open">
      <div v-bind="{ id: state.id, title: state.title }"></div>
    </template>
    <script type="module">export default () => ({})</script>`,
    ({ state }) => {
      state.id = "box";
      state.title = "hello";
      return {};
    }
  );
  const el = mount("v-bindobj");
  const div = el.$shadow.querySelector("div");
  expect(div.getAttribute("id")).toBe("box");
  expect(div.getAttribute("title")).toBe("hello");
  el.$state.title = "bye";
  el.render();
  expect(div.getAttribute("title")).toBe("bye");
});

test("keyboard event modifier", () => {
  defineComponent(
    "v-keymod",
    `<template advect="v-keymod" root="shadow" shadow="open">
      <input @keyup.enter="$state.entered = true" />
    </template>
    <script type="module">export default () => ({})</script>`,
    ({ state }) => {
      state.entered = false;
      return {};
    }
  );
  const el = mount("v-keymod");
  const input = el.$shadow.querySelector("input");
  input.dispatchEvent(
    new KeyboardEvent("keyup", { key: "a", bubbles: true })
  );
  expect(el.$state.entered).toBe(false);
  input.dispatchEvent(
    new KeyboardEvent("keyup", { key: "Enter", bubbles: true })
  );
  expect(el.$state.entered).toBe(true);
});

test("expression errors do not break the tree", () => {
  defineComponent(
    "v-err",
    `<template advect="v-err" root="shadow" shadow="open">
      <span>{{ state.missing.deep }}</span><span>ok</span>
    </template>
    <script type="module">export default () => ({})</script>`
  );
  const el = mount("v-err");
  const spans = el.$shadow.querySelectorAll("span");
  expect(spans[0].textContent).toBe("");
  expect(spans[1].textContent).toBe("ok");
});

test("nested v-for keeps outer locals", () => {
  defineComponent(
    "v-nested",
    `<template advect="v-nested" root="shadow" shadow="open">
      
        <div v-for="group in state.groups" :key="group.name">
          <span v-for="item in group.items" :key="item">{{ group.name }}-{{ item }}</span>
        </div>
      
    </template>
    <script type="module">export default () => ({})</script>`,
    ({ state }) => {
      state.groups = [
        { name: "g1", items: ["x", "y"] },
        { name: "g2", items: ["z"] },
      ];
      return {};
    }
  );
  const el = mount("v-nested");
  const spans = el.$shadow.querySelectorAll("span");
  expect(Array.from(spans).map((s: any) => s.textContent)).toEqual([
    "g1-x",
    "g1-y",
    "g2-z",
  ]);
});

test("renders without a <layout> wrapper or a default export", () => {
  const settings = cweSettingsFromString(
    `<template advect="v-noexport" root="shadow" shadow="open">
      <span>{{ state.msg }}</span>
    </template>`
  )[0];
  expect(settings.layout).not.toBeNull();
  const stylesheet = new (globalThis as any).CSSStyleSheet();
  stylesheet.replace(settings.style ?? "");
  class TestEl extends AdvectElement {}
  (TestEl as any).$settings = settings;
  (TestEl as any).$stylesheet = stylesheet;
  (globalThis as any).customElements.define("v-noexport", TestEl);
  const el = document.createElement("v-noexport");
  document.body.appendChild(el);
  expect(el.$vm).toBeNull();
  expect(el.$shadow.querySelector("span").textContent).toBe("");
});

test("exposes $setup bindings to the template and wires lifecycle hooks", () => {
  const settings = cweSettingsFromString(
    `<template advect="v-setup" root="shadow" shadow="open">
      <span v-text="label"></span>
    </template>`
  )[0];
  const stylesheet = new (globalThis as any).CSSStyleSheet();
  stylesheet.replace(settings.style ?? "");
  class TestEl extends AdvectElement {}
  (TestEl as any).$settings = settings;
  (TestEl as any).$stylesheet = stylesheet;
  (TestEl as any).$advectVMProvider = function () {
    return { label: "hi", onConnect() { (this as any).$state.connected = true; } };
  };
  (globalThis as any).customElements.define("v-setup", TestEl);

  const el: any = mount("v-setup");
  expect(el.$setup.label).toBe("hi");
  expect(el.$shadow.querySelector("span").textContent).toBe("hi");
  expect(el.$state.connected).toBe(true);
});
