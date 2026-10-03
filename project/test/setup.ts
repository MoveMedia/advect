import { Window } from "happy-dom";

export function installDom(): Window {
  const window = new Window({ url: "http://localhost/" });
  const g = globalThis as any;
  g.window = window;
  g.document = window.document;
  g.HTMLElement = window.HTMLElement;
  g.Element = window.Element;
  g.Node = window.Node;
  g.Text = window.Text;
  g.Comment = window.Comment;
  g.DocumentFragment = window.DocumentFragment;
  g.customElements = window.customElements;
  g.CSSStyleSheet = window.CSSStyleSheet;
  g.DOMParser = window.DOMParser;
  g.Event = window.Event;
  g.CustomEvent = window.CustomEvent;
  g.KeyboardEvent = window.KeyboardEvent;
  g.MouseEvent = window.MouseEvent;
  g.InputEvent = window.InputEvent;
  g.requestAnimationFrame = (cb: (time: number) => void) =>
    setTimeout(() => cb(0), 0) as any;
  const proto = window.HTMLElement.prototype as any;
  if (typeof proto.attachInternals !== "function") {
    proto.attachInternals = function () {
      return {
        states: new Set(),
        setFormValue() {},
        setValidity() {},
        checkValidity() {
          return true;
        },
      };
    };
  }
  return window;
}
