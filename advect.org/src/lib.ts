import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';

import '@advect/advect'


export function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  

  export function runHighlighter(){
    // Then register the languages you need
    hljs.registerLanguage('javascript', javascript);
    hljs.registerLanguage('xml', xml);
    hljs.registerLanguage('css', css);
    return hljs;
  }