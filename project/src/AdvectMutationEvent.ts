
export class AdvectMutationEvent extends CustomEvent<MutationRecord>{
    constructor(mutation: MutationRecord){
      super("adv:mutation", {
        bubbles: false,
        composed: true,
        cancelable: false,
        detail: mutation
      });
    }
  }
  