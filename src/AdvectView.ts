import { $window } from "./utils";
//import $m from 'mustache';
import * as Sqrl from 'squirrelly'
import AdvectBase from "./AdvectBase";
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


  static observedAttributes = ['data', 'main-script', 'open-tag', 'close-tag'];

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
    this.render();

  }
  #view:Record<string,any> = {};
  get view(){
    return this.#view;
  }
  async render(newData?: Record<string, any>) {
    this.#view = {
      ...(newData ?? this.#view),
      ...this.dataset
    }
    const open_tag = this.getAttribute('open-tag')?.valueOf() ?? '{{';
    const close_tag = this.getAttribute('close-tag')?.valueOf() ?? '}}';
    const rendered = $m.render(this.innerHTML, this.#view, {}, [open_tag, close_tag]);
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
        this.renderStyles();
  
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
