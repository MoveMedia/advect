import Handlebars from "handlebars";

import { $window } from "./utils";
//import $m from 'mustache';
import AdvectBase from "./AdvectBase";
/**
 * A Untility element for rendering mustache templates
 */
export class AdvectView extends AdvectBase {

  $style = new CSSStyleSheet();
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

    this.$style.insertRule(`:host { display: block; }`);

    this.render = this.render.bind(this);

    this.shadowRoot?.addEventListener("advect:render", (_) => {
      this.render();
    });
    this.render();

  }

  async render(newData?: Record<string, any>) {
    const view = {
      ...(newData ?? {}),
      ...this.scope,
      ...this.dataset,
    }

    console.log('view', view);
    try {
      const rendered =  Handlebars.compile(this.innerHTML)(view);
      console.log('rendered', rendered);
      
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
          console.error('advect-view', err);
        });;

    } catch (err) {
      console.error('advect-view', err);
    }


  }

}


$window.AdvectView = AdvectView;
