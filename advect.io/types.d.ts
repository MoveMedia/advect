declare namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: typeof HTMLElement[elemName]
    }
  }