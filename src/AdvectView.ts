import { $window } from "./utils";
import $m from 'mustache';
import AdvectBase from "./AdvectBase";
/**
 * A Untility element for rendering mustache templates
 */
export class AdvectView extends AdvectBase {
  /**
   * Mutation Observer for the element
   */
  #mutationObserver: MutationObserver | null = null;
  /**
   * getter for mutationObserver
   */
  get mutationObserver() {
    if (this.#mutationObserver == null) {
      this.#mutationObserver = new MutationObserver(() => {
        this.render();
      });
      this.#mutationObserver.observe(this, { childList: true, subtree: true });
    }
    return this.#mutationObserver;
  }


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

    // const defaultcss = new CSSStyleSheet();
    // defaultcss.replaceSync(`
    //     :host{
    //       display: block;
    //       contain: content;
    //       width: 100%;
    //       height: 100%;
    //     }
    // `);
    //this.shadowRoot?.adoptedStyleSheets.push(defaultcss);
    this.render = this.render.bind(this);
    this.shadowRoot?.addEventListener("advect:render", () => {
      this.render();
    });
    this.render();

  }
  async render(additionalData?: Record<string, any>) {
    const view = {
      ...(additionalData ?? {}),
      ...this.dataset
    }
    const open_tag = this.getAttribute('open-tag')?.valueOf() ?? '{{';
    const close_tag = this.getAttribute('close-tag')?.valueOf() ?? '}}';
    const rendered = $m.render(this.innerHTML, view, {}, [open_tag, close_tag]);
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
        this.shadowRoot?.querySelectorAll('[class]').forEach(el => {
          this.tw(el.className)
      }); 
  
      })
      .catch((err) => {
        console.error('advect-view',err);
      });;


    return rendered
  }

}
$window.AdvectView = AdvectView;
