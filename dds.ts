

const dataFrames:((frame:number) =>void)[] = [];
let df = 0;
// Loop over frames and execute them
setInterval(() => {
  const frameFunc = dataFrames.shift();
  if (frameFunc) {
    requestAnimationFrame(() => {
      frameFunc(++df);
    });
  }
}, 100);


// kick off the first frame
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[id]").forEach((el) => {
    const has_data = Object.values(el.attributes).find(
      (attr) => attr.name.indexOf("data-") === 0
    );
    if (has_data && el.nodeType === 1) {
      $d(el as HTMLElement);
      
    }
  });
});

const mut = new MutationObserver((mutationList, observer) => {
  for (const mutation of mutationList) {
    if (mutation.type === "attributes") {
      const frameFunc = (frame_id) => {
        const el = mutation.target as HTMLElement;
        const attr_name = mutation.attributeName ?? '';
        const has_data = Object.values(el.attributes).find
        (
          (attr) => attr.name.indexOf("data-") === 0
        );
        if (!has_data) {
          return;
        }
        const bind_name = attr_name.split("-")[1];
        const attr = attrs.get(el.id + "-" + bind_name) as unknown as Attr;
        const text_bindings = document.querySelectorAll(
          `[bind-text=${bind_name}]`
        );
        text_bindings.forEach((el) => {
          el.innerHTML = attr.value;
        });
      };
      dataFrames.unshift(frameFunc);
    }
    if (mutation.type === "childList") {
      mutation.removedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          const id = (node as HTMLElement).id;
          if (ids.has(id)) {
            ids.delete(id);
          }
          attrs = new Map(
            [...attrs].filter(([key]) => key.split("-")[0] !== id)
          );
        }
      });
    }
  }
});

const config = { attributes: true, childList: true, subtree: true };
// Create an observer instance linked to the callback function
// Start observing the target node for configured mutations
mut.observe(document.getRootNode(), config);

const dataTypes = new Map();


function createDataType(name, parse, store) {
  const type = {
    name,
    parse,
    store,
  };

  dataTypes.set(name, type);
  return type;
}

const numberType = createDataType(
  "number",
  (s) => {
    const n = Number(s);
    return {
      valid: !isNaN(n),
      parsedVal: n,
    };
  },
  (v) => v.toString()
);

const booleanType = createDataType(
  "boolean",
  (s) => {
    const b = s === "true";
    return {
      valid: b,
      parsedVal: b,
    };
  },
  (v) => v.toString()
);

const jsonType = createDataType(
  "object",
  (s) => {
    try {
      const parsed = JSON.parse(s);
      return {
        valid: true,
        parsedVal: parsed,
      };
    } catch (e) {
      return {
        valid: false,
        parsedVal: null,
      };
    }
  },
  (v) => JSON.stringify(v)
);

const stringType = createDataType(
  "string",
  (s) => {
    return {
      valid: true,
      parsedVal: s,
    };
  },
  (v) => v
);

/**
 * @param {Attr} attr
 * @param {ReturnType<typeof createDataType>} attrDataType
 */
function createAttrProxy(attr, attrDataType) {
  return new Proxy(attr, {
    get(target, prop, receiver) {
      if (prop == "value") {
        const val = target.ownerElement.getAttribute(attr.name);
        const { parsedVal } = attrDataType.parse(val);
        return parsedVal;
      }
      return target[prop];
    },
    set(target, prop, value) {
      if (prop == "value") {
        target.ownerElement.setAttribute(attr.name, attrDataType.store(value));
      }
      return true;
    },
  });
}

/**
 * @type {Map<HTMLElement, Attr[]>}
 * */

/**
 *
 * @param {Map<string, Proxy<HTMLElement>>} ids2
 */
const ids = new Map();


let attrs = new Map<String, typeof Proxy<Attr>>();

function $d(el:HTMLElement) {
  if (ids.has(el.id)) {
    return ids.get(el.id);
  }

  const dataEls = document.querySelectorAll(`data[name]`);

  dataEls.forEach((dataEl) => {
    const data_el_name = dataEl.getAttribute("name");
    const data_el_type = dataEl.getAttribute("type");
    const data_el_value = dataEl.getAttribute("value");


    if (data_el_name === null || data_el_name.length === 0) {
      return;
    }
    if (data_el_type !== null && data_el_type.length > 0) {
      el.setAttribute(":" + data_el_name, data_el_type);
    }
    el.setAttribute("data-" + data_el_name, data_el_value || '');
  });
  const entries = Object.entries(el.dataset);

  entries.forEach(([key, value]) => {
    requestAnimationFrame(() => {
      const typeAttr = el.getAttributeNode(":" + key);
      const datasetAttr = el.getAttributeNode("data-" + key);
      const hasType = typeAttr !== null;

      if (hasType) {
        const type = typeAttr.value;
        const knownType = dataTypes.get(type);
        const newAttr = createAttrProxy(datasetAttr, knownType);
        newAttr.value = el.dataset[key];
        const attr_key = el.id + "-" + key;
        attrs.set(attr_key, newAttr);
      }
    });
  });

  const proxy = new Proxy(
    {},
    {
      get(target, prop, receiver) {
        if (attrs.has(prop as string)) {
          const attr_key = el.id + "-" + (prop as string);
          const attr = attrs.get(attr_key) as unknown as Attr;
          if (attr === undefined) {
            return undefined;
          }
          const val = attr.value;
          return val;
        }
        return target[prop];
      },
      set(target, prop, value) {
        const attr_key = el.id + "-" + (prop as string);
        if (attrs.has(attr_key)) {
          const attr = attrs.get(attr_key) as unknown as Attr;
          attr.value = value;
        }
        return true;
      },
    }
  );
  ids.set(el.id, proxy);
  return proxy;
}

function $q(selector) {
  const el = document.querySelector(selector);
  return $d(el);
}

window.$d = $d;
