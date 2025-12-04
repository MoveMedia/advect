import type { HTMLNode } from "./advect.HTMLNode";
import { advect_keys, AsyncFunction } from "./lib";

interface DirectiveDescription {
  handle: (
    node: HTMLNode,
    context: Record<string | number | symbol, any>
  ) => void;
}

function addDirectives(node: HTMLNode) {
  directives.forEach((v, k) => {
    const hasDirective = Object.hasOwn(node.attributes, k);
    if (hasDirective) {
      node.directives[k] = v;
    }
  });
}

const directives = new Map<string, DirectiveDescription>([
  [
    advect_keys.directives.replaceValue,
    {
      handle: (node, context) => {
        let preScript = "";
        Object.keys(context).forEach((v) => {
          preScript += `let ${v} = context['${v}'];`;
        });
        Object.keys(node.attributes).forEach((k) => {
          const v = node.attributes[k].trim();
          if (v.startsWith("{") && v.endsWith("}")) {
            const attrScript = v.substring(1, v.length - 1);

            const res = new Function(
              "context",
              ` ${preScript} return ${attrScript}`
            )(context);
            node.attributes[k] = res;
          }
        });

        const exp = node.content.matchAll(/\{\{(.*?)\}\}/g);
        exp.forEach((v) => {
          console.log(v);
          const contentScript = v[1].trim();
          const res = new Function("context",`${preScript} return ${contentScript}`)(context);
          node.content = node.content.replace(v[0], res);
        });
      },
    },
  ],
  [
    advect_keys.directives.ifStatement,
    {
      handle: (node, context) => {
        context["currentNode"] = node;
        const script = node.attributes[advect_keys.directives.ifStatement];
        // TODO warn if there is no script
        if (!script) return;
        let preScript = "";
        Object.keys(context).forEach((v) => {
          preScript += `let ${v} = context['${v}'];`;
        });
        const res = new Function(
          "context",
          `
          ${preScript}
          return ` + script
        )(context);
        if (!res) {
          node.remove();
        }
      },
    },
  ],
  [
    advect_keys.directives.ofStatement,
    {
      handle: (node, context) => {
        context["currentNode"] = node;
        const script = node.attributes[advect_keys.directives.ofStatement];
        // TODO warn if there is no script
        if (!script) return;
      },
    },
  ],

  [
    advect_keys.directives.forStatement,
    {
      handle: (node, context) => {
        context["currentNode"] = node;
        const script = node.attributes[advect_keys.directives.forStatement];

        // TODO warn if there is no script
        if (!script) return;
        const sides = script.split(" of "); // expect name,index of array
        const left_side = sides[0].split(",");
        const valueName = left_side[0].trim();
        let indexName = "";
        if (left_side.length > 1) {
          indexName = left_side[1].trim();
        }
        const arrayName = sides[1];
        context["og"] = () => node.clone();
        node.children.forEach((n) => n.remove());

        let preScript = Object.keys(context)
          .map((v) => `let ${v} = context['${v}'];`)
          .join("\n");
        const finalScript = `
          ${preScript}
          for (let ${indexName} = 0; ${indexName} < ${arrayName}.length; ${indexName}++) {
            let ${valueName} = ${arrayName}[${indexName}];
              context['${valueName}'] = ${arrayName}[${indexName}];
              context['${indexName}'] = ${indexName};
              const newClone = og();
              newClone.hydrate(context);
              currentNode.parent.addChild(newClone);
          }
          `;
        //    console.log("final", finalScript);
        node.remove();
        const res = new Function("context", finalScript)(context);
      },
    },
  ],
]);

export { directives, addDirectives, type DirectiveDescription };
