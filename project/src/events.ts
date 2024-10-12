
export class AdvectMutationEvent extends CustomEvent<MutationRecord>{
    static Type = "adv:mutation";
    get type(){ return AdvectMutationEvent.Type; }
    constructor(mutation: MutationRecord){
      super("adv:mutation", {
        bubbles: false,
        composed: true,
        cancelable: false,
        detail: mutation
      });
    }
    
  }

  export class AdvectConnectEvent extends CustomEvent<HTMLElement>{
    static Type = "adv:connect";
    get type(){ return AdvectDisconnectEvent.Type; }
    constructor(el: HTMLElement){
      super("adv:connect", {
        bubbles: false,
        composed: false,
        cancelable: false,
        detail: el
      });
    }
  }

  export class AdvectDisconnectEvent extends CustomEvent<HTMLElement>{
    static Type = "adv:disconnect";
    get type(){ return AdvectDisconnectEvent.Type; }
    constructor(el: HTMLElement){
      super("adv:disconnect", {
        bubbles: false,
        composed: true,
        cancelable: false,
        detail: el
      });
    }
  }

  export class AdvectRenderEvent extends CustomEvent<HTMLElement> {
    static Type = "adv:render";
    get type(){ return AdvectRenderEvent.Type; }
    constructor(el: HTMLElement){
      super("adv:render", {
        bubbles: false,
        composed: true,
        cancelable: false,
        detail: el
      });
    }
  }