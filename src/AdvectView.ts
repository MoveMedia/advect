import { $window, AdvectRenderFunction } from "./utils";
import $m from 'mustache';
import AdvectBase from "./AdvectBase";
import settings from "./settings";
/**
 * A Untility element for rendering mustache templates
 */
export class AdvectView extends AdvectBase {

  $style =new CSSStyleSheet();
  /**
   * instance counter
   */
  static ic = 0;
  /**
   * getter for *.constructor.ic
   */
  // @ts-ignore instance counter
  get ic() { return this.constructor.ic; }


  static observedAttributes = ['data', 'main-script', 'open-tag', 'close-tag', "renderer"];

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
    this.shadowRoot?.addEventListener("advect:render", ( _ ) => {
      this.render();
    });
    this.adv.plugins.connected(this);
    this.render();

  }
  #view:Record<string,any> = {};
  get view(){
    return this.#view;
  }
  async render(newData?: Record<string, any>) {
    let renderFunc: AdvectRenderFunction | undefined;
    const renderer_name = this.getAttribute('renderer')?.valueOf() ?? settings.default_renderer;
       renderFunc = this.adv.plugins.getRenderer(renderer_name);
    // if new data is reactive pretty sure we dont want to just pass that to mustache
    this.#view = {
      ...(newData ?? this.#view),
      ...this.dataset
    }

    if (!renderFunc) {
      console.error(`No renderer found for ${renderer_name}`);
      return `No renderer found for ${renderer_name}`;
    }

    let rendered = renderFunc(this, this.innerHTML, this.#view);

    const wrapper = document.createElement("div");
    wrapper.setAttribute("part", "content");
    wrapper.innerHTML = rendered;
    while (this.shadowRoot?.firstChild) {
      this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    }
    this.shadowRoot?.appendChild(wrapper);
    this.setupRefs();
    await this.generateScope()
      .then(() => {
        this.hookRefs();
        this.adv.plugins.rendered(this);
      })
      .catch((err) => {
        console.error('advect-view',err);
      });;

    return rendered
  }
  mutate(mutation: MutationRecord): void {
      super.mutate(mutation);
  }

}
$window.AdvectView = AdvectView;
