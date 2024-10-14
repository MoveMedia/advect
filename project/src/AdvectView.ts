import { $window, AdvectRenderFunction, RenderDescriptor } from "./utils";
import AdvectBase from "./AdvectBase";
import config from "./config";
import { AdvectRenderEvent } from "./events";
/**
 * A Utility element for rendering  templates
 */
export class AdvectView extends AdvectBase {
  static $Style: CSSStyleSheet = new CSSStyleSheet();
  /**
   * instance counter
   */
  static ic = 0;
  /**
   * getter for *.constructor.ic
   */
  get ic() {
    // @ts-ignore instance counter
    return this.constructor.ic;
  }

  static observedAttributes = [
    "data",
    "main-script",
    "open-tag",
    "close-tag",
    "render",
    "target",
  ];

  main_script?: string;


  constructor() {
    super();
  }
  /**
   * connectedCallback for the element
   * must call super.connectedCallback() if overriden
   */
  connectedCallback() {
    super.connectedCallback();
    // @ts-ignore instance counter
    this.constructor.ic++;
    this.render = this.render.bind(this);
    this.hookRefs = this.hookRefs.bind(this);
    this.hookRefs();
    this.shadowRoot?.addEventListener(AdvectRenderEvent.Type, (_) => {
      this.render();
    });

    this.adv.plugins.component_connected(this);

    this.$scopes_scripts = [
      ...(this.querySelector("template")?.content.querySelectorAll(
        "script:not([type]):not([ignore])"
      ) ?? []),
    ].map((script) => {
      script.remove();
      return { id: script.id, script: script.textContent as string };
    });

    this.generateScope()
      .then(this.hookRefs)
      .then(() => {
        this.handleLoad();
        this.adv.plugins.view_rendered(this);
      });
  }
  async renderTo(target: HTMLElement, data?: Record<string, any>, inner = true) {
    const markup = await this.render(data, true);
    if (inner){
      target.innerHTML = markup;
    }else{
      target.outerHTML = markup
    }
  }
  async render(newData?: Record<string, any>, markupOnly = false) {
    let renderFunc: AdvectRenderFunction | undefined;
    const renderer_name =
      this.getAttribute("render")?.valueOf() ?? config.default_renderer;
    renderFunc = this.adv.plugins.getRenderer(renderer_name);
    // if new data is reactive pretty sure we dont want to just pass that to mustache

    if (!renderFunc) {
      console.error(`No renderer found for ${renderer_name}`);
      return `No renderer found for ${renderer_name}`;
    }
    let ctx = {
      ...(newData ?? {}),
      ...this.dataset,
      $self:this
    };

    const desc: RenderDescriptor = {
      template: this.innerHTML,
      ctx,
      view: this,
    };
    const rendered = renderFunc(desc);

    if (markupOnly) {
      return rendered;
    }

    const wrapper = document.createElement("div");
    wrapper.setAttribute("part", "content");
    wrapper.innerHTML = rendered;
    while (this.shadowRoot?.firstChild) {
      this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    }
    this.shadowRoot?.appendChild(wrapper);
    this.hookRefs();
    this.adv.plugins.view_rendered(this);

    return rendered;
  }
}
// add it to the window
// we dont set it to the custom element because we want to be able to use it in the plugins
$window.AdvectView = AdvectView;
