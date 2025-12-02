import { HTMLNode } from "./advect.HTMLNode";

// /**
//  * Parses rendering templates to suppor the pseudo elements (for/else/of)
//  * as well has handles escaped text
//  * @param template 
//  * @param etaConf 
//  * @returns 
//  */
// export function cleanTemplate(template:string, etaConf:EtaConfig) {
//     const [s, e] = etaConf.tags;
//     const r = etaConf.parse.exec;
//     const unescaped = convertEscapedChars(template);
//   //  const _subview = addBracesToSubview(unescaped)
//     const _if = convertIfElse(unescaped);
//     const _for = convertFor(_if);
//     const _of = convertOf(_for);
//     const _tables = convertTables(_of)
//     function convertEscapedChars(template:string) {
//         return template
//             .replace(/&gt;/g, ">")
//             .replace(/&lt;/g, "<")
//             .replace(/&amp;/g, "&");
//     }
    
//     function convertIfElse(template:string) {
//         return template
//             .replace(/<if check="([^"]+)">/g, `${s}${r} if ( $1 ) { ${e}`)
//             .replace(/<else\/?>/g, `${s}${r} } else { ${e}`)
//             .replace(/<\/if>/g, `${s}${r} } ${e}`);
//     }
    
    
//     function convertFor(template:string) {
//         return template
//             .replace(
//                 /<for data="([^"]+)"(?: name="([^"]+)")?(?: index="([^"]+)")?>/g,
//                 function (_, data, name, index) {
//                     if (name && index) {
//                         return `${s}${r} ${data}.forEach(function(${name}, ${index}){ ${e}`;
//                     } else if (name) {
//                         return `${s}${r} ${data}.forEach(function(${name}){ ${e}`;
//                     } else {
//                         return `${s}${r} ${data}.forEach(function(){ ${e}`;
//                     }
//                 }
//             )
//             .replace(/<\/for>/g, `${s}${r} }); ${e}`);
//     }
    
    
//     function convertOf(template:string) {
//         return template
//             .replace(
//                 /<of data="([^"]+)"(?: name="([^"]+)")?(?: value="([^"]+)")?>/g,
//                 function (_, data, name, value) {
//                     if (name && value) {
//                         return `${s}${r} Object.keys(${data}).forEach(function(${name}) { ${e} 
//                         ${s}${r} const ${value} = ${data}[${name}] ${e}
//                     `;
//                     } else if (name) {
//                         return `${s}${r} Object.keys(${data}).forEach(function(${name}) { ${e}`;
//                     } else {
//                         return `${s}${r} Object.keys(${data}).forEach(function() { ${e}`;
//                     }
//                 }
//             )
//             .replace(/<\/of>/g, `${s}${r} }); ${e}`);
//     }
  
//     return _tables;
// }




export function convertTables(template:string,) {
  const replacements: Record<string, string> = {
    '<t-table': '<table',
    '</t-table>': '</table>',
    '<t-head': '<thead',
    '</t-head>': '</thead>',
    '<t-body': '<tbody',
    '</t-body>': '</tbody>',
    '<t-foot': '<tfoot',
    '</t-foot>': '</tfoot>',
    '<t-r': '<tr',
    '</t-r>': '</tr>',
    '<t-d': '<td',
    '</t-d>': '</td>',
    '<t-h': '<th',
    '</t-h>': '</th>',
  };

  return template
      .replaceAll('<t-table','<table')
      .replaceAll('</t-table>','</table>')
      // thead
      .replaceAll('<t-head','<thead')
      .replaceAll('</t-head>','</thead>')
       // tbody
       .replaceAll('<t-body','<tbody')
       .replaceAll('</t-body>','</tbody>')
        // tfoot
        .replaceAll('<t-foot','<tfoot')
        .replaceAll('</t-foot>','</tfoot>')
        // tr
        .replaceAll('<t-r','<tr')
        .replaceAll('</t-r>','</tr>')
        // td
        .replaceAll('<t-d','<td')
        .replaceAll('</t-d>','</td>')
        // td
        .replaceAll('<t-h','<th')
        .replaceAll('</t-h>','</th>')

  
}


const directives = new Map([
    ['adv-for',''],
    ['adv-if',''],
    ['adv-of',''],
])

export function renderTree(layout:string, frame:Record<string | number | symbol, any>):string{
    const nodeTree = HTMLNode.create(layout);

    

    return ''
}