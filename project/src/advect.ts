/**
 * Advect web component library.
 */
// @ts-ignore There are no TS definitions for this lib
import getCrossOriginWorkerURL from "crossoriginworker";
import { Actions, type ActionKey } from "./advect.actions";
import {
  type CustomElementSettings,
  toModule,
  type AvectVMProvider,
  AdvectSettings,
  decodePropertySyntax,
} from "./lib";

import { AdvectElement } from "./advect.element";

/**
 * Creates a shared worker for running advect
 * @returns a shared worker for running advect
 */
const createAdvectSharedWorker = async () => {
  const openPromises = new Map<
    string,
    { resolve: Function; reject: Function }
  >();
  const workerUrl = await getCrossOriginWorkerURL(
    new URL("advect.sharedworker.js", import.meta.url).href
  );
  const worker = new SharedWorker(workerUrl, { type: "module" });
  worker.onerror = (e) => {
    console.warn("error", e);
  };
  worker.port.onmessage = (e) => {
    const pr = openPromises.has(e.data.$id) && openPromises.get(e.data.$id);
    if (e.data?.isError === true && pr) {
      pr.reject(e);
    }
    if (pr) {
      pr.resolve(e);
      openPromises.delete(e.data.$id);
    }
  };
  const messagePromise = async (
    action: string,
    data: Record<string, any> | any
  ) => {
    return new Promise((resolve, reject) => {
      const $id = Math.random().toString(36).substr(2, 9);
      openPromises.set($id, { resolve, reject });
      worker.port.postMessage({ action, data, $id });
    });
  };
  return {
    messagePromise,
    worker,
    type: "shared",
  };
};

/**
 * Creates a dedicated worker for running advect
 * @returns a dedicated worker for running advect
 */
const createAdvectDedicatedWorker = async () => {
  const openPromises = new Map<
    string,
    { resolve: Function; reject: Function }
  >();

  const workerUrl = await getCrossOriginWorkerURL(
    new URL("advect.worker.js", import.meta.url).href
  );
  const worker = new Worker(workerUrl, { type: "module" });
  worker.onerror = (e) => {
    console.error("error", e);
  };
  worker.onmessage = (e) => {
    const pr = openPromises.has(e.data.$id) && openPromises.get(e.data.$id);
    if (e.data?.isError === true && pr) {
      pr.reject(e);
    }
    if (pr) {
      pr.resolve(e);
      openPromises.delete(e.data.$id);
    }
  };
  const messagePromise = async (action: string, data: Record<string, any>) => {
    return new Promise((resolve, reject) => {
      const $id = Math.random().toString(36).substr(2, 9);
      openPromises.set($id, { resolve, reject });
      worker.postMessage({ action, data, $id });
    });
  };
  return {
    messagePromise,
    worker,
    type: "dedicated",
  };
};

/**
 * Creates a no worker for running advect
 * @returns a shared worker for running advect
 */
const createAdvectNoWorker = () => {
  // to keep the workflow the same we use 2  broadcast channels noWorker2 sends to noWorker
  const noWorker = new BroadcastChannel("advect:noworker");
  const noWorker2 = new BroadcastChannel("advect:noworker");

  noWorker.onmessageerror = (ev) => console.error(ev);
  noWorker.onmessage = (e) => {
    const pr = openPromises.has(e.data.$id) && openPromises.get(e.data.$id);
    if (e.data?.isError === true && pr) {
      pr.reject(e);
    }
    if (pr) {
      // @ts-ignore
      Actions[e.data.action as ActionKey]
        .call(null, e.data.data)
        .then((result) => {
          e.data.result = result;
          pr.resolve(e);
          openPromises.delete(e.data.$id);
        });
    }
  };
  const openPromises = new Map<
    string,
    { resolve: Function; reject: Function }
  >();
  const messagePromise = async (action: string, data: Record<string, any>) => {
    return new Promise((resolve, reject) => {
      const $id = crypto.randomUUID();
      openPromises.set($id, { resolve, reject });
      noWorker2.postMessage({ action, data, $id });
    });
  };
  return {
    messagePromise,
    worker: null,
    type: "no-worker",
  };
};

/**
 * Creates the advect instance with the correct worker type
 * @returns
 */
const createAdvect = async () => {
  (window as any).AdvectElement = AdvectElement;

  const workerType = new URL(import.meta.url).searchParams
    .get("type")
    ?.toLocaleLowerCase(); // 5
  let messagePromise: (
    action: string,
    data: Record<string, any>
  ) => Promise<unknown> | null;
  switch (workerType) {
    case "d":
      messagePromise = (await createAdvectDedicatedWorker()).messagePromise;
      break;
    case "s":
      messagePromise = (await createAdvectSharedWorker()).messagePromise;
      break;
    default:
      messagePromise = createAdvectNoWorker().messagePromise;
      break;
  }

  const initStorage = () => {
    if (!localStorage.getItem(AdvectSettings.data.session_key)) {
      saveStorage({ loaded: {} });
    }
  };

  const getStorage = () => {
    if (!localStorage.getItem(AdvectSettings.data.session_key)) {
      initStorage();
    }
    return JSON.parse(
      localStorage.getItem(AdvectSettings.data.session_key) ?? "{}"
    );
  };
  const saveStorage = (storage: any) => {
    localStorage.setItem(
      AdvectSettings.data.session_key,
      JSON.stringify(storage)
    );
  };
  const addLoaded = (urls: string | string[]) => {
    const storage = getStorage();
    if (Array.isArray(urls)){
      urls.forEach( url =>{
        storage.loaded[url] = true;
      })
    }

    if (typeof urls == "string") {
      storage.loaded[urls] = true;
    }
    saveStorage(storage);
  };

  const isLoaded = (url: string) => {
    const storage = getStorage();
    return storage.loaded?.[url] === true;
  };
  /**
   * Loads a webcomponent from a url or list of urls
   * @param urls
   * @returns
   */
  const load = async (urls: string | string[], forceReload = false) => {
    const buildMsg = (await messagePromise("load", { urls })) as MessageEvent<{
      result: CustomElementSettings[];
      id: string;
      action: ActionKey;
    }>;
    const buildSettings = buildMsg.data.result;
    addLoaded(urls);
    return createCustomElementClasses(buildSettings);
  };

  /**
   * Creates the "Class" that will be used to register users custom components
   * @param buildSettings
   * @param register
   * @returns
   */
  const createCustomElementClasses = (
    buildSettings: CustomElementSettings[],
    register = true
  ) => {
    const buildClasses: any[] = [];
    // todo try here
    for (let settings of buildSettings) {
      // for some reason ts thinks settings is used before being declared so let's add a pointer
      const $settings = settings;

      $settings.loads.forEach( l => {
        if (!isLoaded(l)) load(l);
      })

      if (customElements.get($settings.tagName)) {
        console.warn(`Already registered ${$settings.tagName}`);
        continue;
      }

      load($settings.loads, false);

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

    return buildClasses;
  };

  /**
   *
   * @param template
   * @returns
   */
  const build = async (template: string) => {
    const buildMsg = (await messagePromise("build", {
      template,
    })) as MessageEvent<{
      result: CustomElementSettings[];
      id: string;
      action: ActionKey;
    }>;

    
    const buildSettings = buildMsg.data.result;
    return createCustomElementClasses(buildSettings);
  };

  /**
   * Loads Elements that are inlined in the document
   * @param _ the DOMContentLoaded Event
   */
  const onContent = (_: Event | null) => {
    document
      .querySelectorAll(`template[${AdvectSettings.attributes.template}]`)
      .forEach((template) => build(template.outerHTML));

    let templateScriptUrls: string[] = [];
    document.querySelectorAll("script[rel]").forEach((e) => {
      if (e.hasAttribute("rel")) {
        templateScriptUrls.push(e.getAttribute("rel") ?? "");
      }
    });
    load(templateScriptUrls);

    document.removeEventListener("DOMContentLoaded", onContent);
  };

  if (document.readyState !== "loading") {
    onContent(null);
  } else {
    document.addEventListener("DOMContentLoaded", onContent);
  }

  return {
    build,
    load,
  };
};

// This is necessary so that elements can

export const advect = await createAdvect();
