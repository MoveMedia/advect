import { range, set } from "lodash";
import {
  AdvectSettings,
  decodePropertySyntax,
  getDefaultElementSettings,
  toModule,
  type AvectVMProvider,
  type CustomElementSettings,
} from "./advect.lib";
import { AdvectElement } from "./advect.element";
import { root } from "postcss";

export const AdvectStorage = new Proxy(
  {
    // Default stuff here I guess
    loaded: {} as Record<string, any>,
    clear: () => {
      AdvectStorage.loaded = {};
    },
  },
  {
    set: (_, p, newValue) => {
      const storage = JSON.parse(
        localStorage.getItem(AdvectSettings.data.session_key) ?? "{}"
      );
      storage[p] = newValue;
      localStorage.setItem(
        AdvectSettings.data.session_key,
        JSON.stringify(storage)
      );
      return true;
    },
    get: (_, p) => {
      if (p == "clear") return _.clear;
      const storage = JSON.parse(
        localStorage.getItem(AdvectSettings.data.session_key) ?? "{}"
      );
      return storage[p];
    },
    ownKeys: () => {
      return Object.keys(localStorage);
    },
  }
);

AdvectStorage.clear();

export const cweSettingsFromDoc = (doc: Document) => {
  if (!doc) return [];
  const settings: CustomElementSettings[] = [];
  const templates = Array.from(doc.querySelectorAll(`template[${AdvectSettings.attributes.template}]`)) as HTMLTemplateElement[];

  for (let template of templates) {
    const content = template.content.cloneNode(true) as HTMLElement;
    const setting = getDefaultElementSettings();
    setting.tagName = template.getAttribute(AdvectSettings.attributes.template) ?? "";
    if (template.hasAttribute('root')) {
      setting.root = template.getAttribute('root') as 'light' | 'shadow' | 'none';
    }
    if (template.hasAttribute('shadow')) {
      setting.shadow = template.getAttribute('shadow') as 'open' | 'closed';
    }

    for (const rootChild of Array.from(content.children)) {
      if (rootChild.nodeName == 'LAYOUT') {
        setting.layout = rootChild.cloneNode(true) as HTMLElement;
      }
      if (rootChild.nodeName == 'DATALIST') {
        Array.from(rootChild.children)
          .map((child) => {
            if (child.nodeName == 'OPTION') {
              return {
                name: child.getAttribute('name'),
                type: child.getAttribute('type'),
              }
            }
          }).filter(v => v?.name)
          .forEach(v => {
            setting.watched[v?.name ?? ''] = {
              type: (v?.type ?? 'string') as any,
            }
          })

      }
      if (rootChild.nodeName == 'SCRIPT' && rootChild.getAttribute('type') == 'module') {
        setting.module = rootChild.textContent ?? '';
      }
      if (rootChild.nodeName == 'SCRIPT' && rootChild.getAttribute('rel')) {
        setting.loads.push(rootChild.getAttribute('rel') ?? '');
      }
      if (rootChild.nodeName == 'STYLE') {
        setting.style = rootChild.textContent ?? '';
      }
    }
    settings.push(setting);
  }
  return settings;
};

export const cweSettingsFromString = (htmlString: string) => {
  // Create a Range object
  // Use createContextualFragment to parse the HTML string
  try {
    const docParser = new DOMParser();
    const doc = docParser.parseFromString(htmlString, "text/html");
    return cweSettingsFromDoc(doc);
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const cweFromTemplate = (template: HTMLTemplateElement) => {
  return cweSettingsFromString(template.outerHTML);
};

export const createCustomElementClasses = (
  buildSettings: CustomElementSettings[],
  register = true
) => {
  const buildClasses: any[] = [];

  // todo try here
  for (let settings of buildSettings) {
    // for some reason ts thinks settings is used before being declared so let's add a pointer
    const $settings = settings;
    if (customElements.get($settings.tagName)) {
      console.warn(`Already registered ${$settings.tagName}`);
      continue;
    }
    toModule(settings.module, []).then((module: any) => {
      // TODO fix change to module default
      //const moduleClass = module[moduleClassName];
      const stylesheet = new CSSStyleSheet();
      stylesheet.replace(decodePropertySyntax($settings.style));
      const newClass = class extends AdvectElement {
        static observedAttributes = Object.keys($settings.watched);
        static $settings = $settings;
        static $stylesheet = stylesheet;
        static $advectVMProvider: AvectVMProvider = module.default;
        connectedCallback(): void {
          super.connectedCallback();
        }
      };
      if (
        register &&
        $settings.tagName.length >= 3 &&
        $settings.tagName.indexOf("-") &&
        customElements.get($settings.tagName) === undefined
      ) {
        customElements.define($settings.tagName, newClass as any);
      }
      buildClasses.push(newClass);
    });
  }
  const loaded = { ...AdvectStorage.loaded };
  const buildLoads = buildSettings.map((s) => s.loads).flat().filter(f => !loaded[f]);
  buildLoads.forEach((l) => (loaded[l] = true));
  AdvectStorage.loaded = loaded;
  cweFromUrls(buildLoads);

  return buildClasses;
};


const cweFromUrls = async (urls: string | string[]) => {
  const settingResults: CustomElementSettings[] = [];
  const _urls: string[] = [];

  if (Array.isArray(urls)) {
    _urls.push(...urls);
  }
  if (typeof urls == "string") {
    _urls.push(urls);
  }

  const results = await Promise.all(_urls.map((url) => fetch(url)
    .then((r) => r.text())
    .then(t => cweSettingsFromString(t)))
  ).then(r => r.flat());

  settingResults.push(...results)
  return settingResults;
}

const onContent = (_: Event | null) => {
  const settingsFromTemplates = Array.from(document
    .querySelectorAll(`template[${AdvectSettings.attributes.template}]`))
    .map((template) => cweFromTemplate(template as HTMLTemplateElement)).flat()

  createCustomElementClasses(settingsFromTemplates);


  let settingsFromUrls: string[] =
    Array.from(document.querySelectorAll("script[rel]"))
      .map((script) => script.getAttribute("rel") ?? "")
      .filter(v => v.length > 0)

  cweFromUrls(settingsFromUrls).then(s => {
    createCustomElementClasses(s);
  });
  document.removeEventListener("DOMContentLoaded", onContent);
};

if (document.readyState !== "loading") {
  onContent(null);
} else {
  document.addEventListener("DOMContentLoaded", onContent);
}