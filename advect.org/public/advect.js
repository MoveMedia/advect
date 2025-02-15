var cG=Object.create;var{getPrototypeOf:uG,defineProperty:FG,getOwnPropertyNames:dG}=Object;var lG=Object.prototype.hasOwnProperty;var OG=(G,J,X)=>{X=G!=null?cG(uG(G)):{};const Y=J||!G||!G.__esModule?FG(X,"default",{value:G,enumerable:!0}):X;for(let Z of dG(G))if(!lG.call(Y,Z))FG(Y,Z,{get:()=>G[Z],enumerable:!0});return Y};var MG=(G,J)=>()=>(J||G((J={exports:{}}).exports,J),J.exports);var RG=MG((DJ,LG)=>{var iG=(G,J={})=>{const X={skipSameOrigin:!0,useBlob:!0,...J};if(!G.includes("://")||G.includes(window.location.origin))return Promise.resolve(G);return new Promise((Y,Z)=>fetch(G).then((D)=>D.text()).then((D)=>{let $=new URL(G).href.split("/");$.pop();const I=`const _importScripts = importScripts;
const _fixImports = (url) => new URL(url, '${$.join("/")+"/"}').href;
importScripts = (...urls) => _importScripts(...urls.map(_fixImports));`;let M="data:application/javascript,"+encodeURIComponent(I+D);if(X.useBlob)M=URL.createObjectURL(new Blob([`importScripts("${M}")`],{type:"application/javascript"}));Y(M)}).catch(Z))};LG.exports=iG});var PG=MG((i,WG)=>{(function(G,J){typeof i=="object"&&typeof WG!="undefined"?J(i):typeof define=="function"&&define.amd?define(["exports"],J):J((G||self).eta={})})(i,function(G){function J(){return J=Object.assign?Object.assign.bind():function(q){for(var z=1;z<arguments.length;z++){var K=arguments[z];for(var Q in K)Object.prototype.hasOwnProperty.call(K,Q)&&(q[Q]=K[Q])}return q},J.apply(this,arguments)}function X(q,z){q.prototype=Object.create(z.prototype),q.prototype.constructor=q,Z(q,z)}function Y(q){return Y=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(z){return z.__proto__||Object.getPrototypeOf(z)},Y(q)}function Z(q,z){return Z=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(K,Q){return K.__proto__=Q,K},Z(q,z)}function D(q,z,K){return D=function(){if(typeof Reflect=="undefined"||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if(typeof Proxy=="function")return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){})),!0}catch(Q){return!1}}()?Reflect.construct.bind():function(Q,B,H){var x=[null];x.push.apply(x,B);var E=new(Function.bind.apply(Q,x));return H&&Z(E,H.prototype),E},D.apply(null,arguments)}function $(q){var z=typeof Map=="function"?new Map:void 0;return $=function(K){if(K===null||Function.toString.call(K).indexOf("[native code]")===-1)return K;if(typeof K!="function")throw new TypeError("Super expression must either be null or a function");if(z!==void 0){if(z.has(K))return z.get(K);z.set(K,Q)}function Q(){return D(K,arguments,Y(this).constructor)}return Q.prototype=Object.create(K.prototype,{constructor:{value:Q,enumerable:!1,writable:!0,configurable:!0}}),Z(Q,K)},$(q)}var I=function(){function q(K){this.cache=void 0,this.cache=K}var z=q.prototype;return z.define=function(K,Q){this.cache[K]=Q},z.get=function(K){return this.cache[K]},z.remove=function(K){delete this.cache[K]},z.reset=function(){this.cache={}},z.load=function(K){this.cache=J({},this.cache,K)},q}(),M=function(q){function z(K){var Q;return(Q=q.call(this,K)||this).name="Eta Error",Q}return X(z,q),z}($(Error)),F=function(q){function z(K){var Q;return(Q=q.call(this,K)||this).name="EtaParser Error",Q}return X(z,q),z}(M),O=function(q){function z(K){var Q;return(Q=q.call(this,K)||this).name="EtaRuntime Error",Q}return X(z,q),z}(M),V=function(q){function z(K){var Q;return(Q=q.call(this,K)||this).name="EtaNameResolution Error",Q}return X(z,q),z}(M);function S(q,z,K){var Q=z.slice(0,K).split(/\n/),B=Q.length,H=Q[B-1].length+1;throw q+=" at line "+B+" col "+H+":\n\n  "+z.split(/\n/)[B-1]+"\n  "+Array(H).join(" ")+"^",new F(q)}function L(q,z,K,Q){var B=z.split("\n"),H=Math.max(K-3,0),x=Math.min(B.length,K+3),E=Q,f=B.slice(H,x).map(function(a,u){var b=u+H+1;return(b==K?" >> ":"    ")+b+"| "+a}).join("\n"),C=new O((E?E+":"+K+"\n":"line "+K+"\n")+f+"\n\n"+q.message);throw C.name=q.name,C}var k=function(){return Promise.resolve()}.constructor;function R(q,z){var K=this.config,Q=z&&z.async?k:Function;try{return new Q(K.varName,"options",this.compileToString.call(this,q,z))}catch(B){throw B instanceof SyntaxError?new F("Bad template syntax\n\n"+B.message+"\n"+Array(B.message.length+1).join("=")+"\n"+this.compileToString.call(this,q,z)+"\n"):B}}function P(q,z){var K=this.config,Q=z&&z.async,B=this.compileBody,H=this.parse.call(this,q),x=K.functionHeader+'\nlet include = (template, data) => this.render(template, data, options);\nlet includeAsync = (template, data) => this.renderAsync(template, data, options);\n\nlet __eta = {res: "", e: this.config.escapeFunction, f: this.config.filterFunction'+(K.debug?', line: 1, templateStr: "'+q.replace(/\\|"/g,"\\$&").replace(/\r\n|\n|\r/g,"\\n")+'"':"")+"};\n\nfunction layout(path, data) {\n  __eta.layout = path;\n  __eta.layoutData = data;\n}"+(K.debug?"try {":"")+(K.useWith?"with("+K.varName+"||{}){":"")+"\n\n"+B.call(this,H)+"\nif (__eta.layout) {\n  __eta.res = "+(Q?"await includeAsync":"include")+" (__eta.layout, {..."+K.varName+", body: __eta.res, ...__eta.layoutData});\n}\n"+(K.useWith?"}":"")+(K.debug?"} catch (e) { this.RuntimeErr(e, __eta.templateStr, __eta.line, options.filepath) }":"")+"\nreturn __eta.res;\n";if(K.plugins)for(var E=0;E<K.plugins.length;E++){var f=K.plugins[E];f.processFnString&&(x=f.processFnString(x,K))}return x}function j(q){for(var z=this.config,K=0,Q=q.length,B="";K<Q;K++){var H=q[K];if(typeof H=="string")B+="__eta.res+='"+H+"'\n";else{var x=H.t,E=H.val||"";z.debug&&(B+="__eta.line="+H.lineNo+"\n"),x==="r"?(z.autoFilter&&(E="__eta.f("+E+")"),B+="__eta.res+="+E+"\n"):x==="i"?(z.autoFilter&&(E="__eta.f("+E+")"),z.autoEscape&&(E="__eta.e("+E+")"),B+="__eta.res+="+E+"\n"):x==="e"&&(B+=E+"\n")}}return B}var jG={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function fG(q){return jG[q]}var zG={autoEscape:!0,autoFilter:!1,autoTrim:[!1,"nl"],cache:!1,cacheFilepaths:!0,debug:!1,escapeFunction:function(q){var z=String(q);return/[&<>"']/.test(z)?z.replace(/[&<>"']/g,fG):z},filterFunction:function(q){return String(q)},functionHeader:"",parse:{exec:"",interpolate:"=",raw:"~"},plugins:[],rmWhitespace:!1,tags:["<%","%>"],useWith:!1,varName:"it",defaultExtension:".eta"},v=/`(?:\\[\s\S]|\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})*}|(?!\${)[^\\`])*`/g,p=/'(?:\\[\s\w"'\\`]|[^\n\r'\\])*?'/g,m=/"(?:\\[\s\w"'\\`]|[^\n\r"\\])*?"/g;function c(q){return q.replace(/[.*+\-?^${}()|[\]\\]/g,"\\$&")}function _G(q,z){return q.slice(0,z).split("\n").length}function yG(q){var z=this.config,K=[],Q=!1,B=0,H=z.parse;if(z.plugins)for(var x=0;x<z.plugins.length;x++){var E=z.plugins[x];E.processTemplate&&(q=E.processTemplate(q,z))}function f(A,_){A&&(A=function(w,o,t,e){var T,N;return Array.isArray(o.autoTrim)?(T=o.autoTrim[1],N=o.autoTrim[0]):T=N=o.autoTrim,(t||t===!1)&&(T=t),(e||e===!1)&&(N=e),N||T?T==="slurp"&&N==="slurp"?w.trim():(T==="_"||T==="slurp"?w=w.trimStart():T!=="-"&&T!=="nl"||(w=w.replace(/^(?:\r\n|\n|\r)/,"")),N==="_"||N==="slurp"?w=w.trimEnd():N!=="-"&&N!=="nl"||(w=w.replace(/(?:\r\n|\n|\r)$/,"")),w):w}(A,z,Q,_),A&&(A=A.replace(/\\|'/g,"\\$&").replace(/\r\n|\n|\r/g,"\\n"),K.push(A)))}z.rmWhitespace&&(q=q.replace(/[\r\n]+/g,"\n").replace(/^\s+|\s+$/gm,"")),v.lastIndex=0,p.lastIndex=0,m.lastIndex=0;for(var C,a=[H.exec,H.interpolate,H.raw].reduce(function(A,_){return A&&_?A+"|"+c(_):_?c(_):A},""),u=new RegExp(c(z.tags[0])+"(-|_)?\\s*("+a+")?\\s*","g"),b=new RegExp("'|\"|`|\\/\\*|(\\s*(-|_)?"+c(z.tags[1])+")","g");C=u.exec(q);){var pG=q.slice(B,C.index);B=C[0].length+C.index;var r=C[2]||"";f(pG,C[1]),b.lastIndex=B;for(var U=void 0,d=!1;U=b.exec(q);){if(U[1]){var mG=q.slice(B,U.index);u.lastIndex=B=b.lastIndex,Q=U[2],d={t:r===H.exec?"e":r===H.raw?"r":r===H.interpolate?"i":"",val:mG};break}var l=U[0];if(l==="/*"){var BG=q.indexOf("*/",b.lastIndex);BG===-1&&S("unclosed comment",q,U.index),b.lastIndex=BG}else l==="'"?(p.lastIndex=U.index,p.exec(q)?b.lastIndex=p.lastIndex:S("unclosed string",q,U.index)):l==='"'?(m.lastIndex=U.index,m.exec(q)?b.lastIndex=m.lastIndex:S("unclosed string",q,U.index)):l==="`"&&(v.lastIndex=U.index,v.exec(q)?b.lastIndex=v.lastIndex:S("unclosed string",q,U.index))}d?(z.debug&&(d.lineNo=_G(q,C.index)),K.push(d)):S("unclosed tag",q,C.index)}if(f(q.slice(B,q.length),!1),z.plugins)for(var n=0;n<z.plugins.length;n++){var IG=z.plugins[n];IG.processAST&&(K=IG.processAST(K,z))}return K}function KG(q,z){var K=z&&z.async?this.templatesAsync:this.templatesSync;if(this.resolvePath&&this.readFile&&!q.startsWith("@")){var Q=z.filepath,B=K.get(Q);if(this.config.cache&&B)return B;var H=this.readFile(Q),x=this.compile(H,z);return this.config.cache&&K.define(Q,x),x}var E=K.get(q);if(E)return E;throw new V("Failed to get template '"+q+"'")}function DG(q,z,K){var Q,B=J({},K,{async:!1});return typeof q=="string"?(this.resolvePath&&this.readFile&&!q.startsWith("@")&&(B.filepath=this.resolvePath(q,B)),Q=KG.call(this,q,B)):Q=q,Q.call(this,z,B)}function QG(q,z,K){var Q,B=J({},K,{async:!0});typeof q=="string"?(this.resolvePath&&this.readFile&&!q.startsWith("@")&&(B.filepath=this.resolvePath(q,B)),Q=KG.call(this,q,B)):Q=q;var H=Q.call(this,z,B);return Promise.resolve(H)}function kG(q,z){var K=this.compile(q,{async:!1});return DG.call(this,K,z)}function hG(q,z){var K=this.compile(q,{async:!0});return QG.call(this,K,z)}var gG=function(){function q(K){this.config=void 0,this.RuntimeErr=L,this.compile=R,this.compileToString=P,this.compileBody=j,this.parse=yG,this.render=DG,this.renderAsync=QG,this.renderString=kG,this.renderStringAsync=hG,this.filepathCache={},this.templatesSync=new I({}),this.templatesAsync=new I({}),this.resolvePath=null,this.readFile=null,this.config=K?J({},zG,K):J({},zG)}var z=q.prototype;return z.configure=function(K){this.config=J({},this.config,K)},z.withConfig=function(K){return J({},this,{config:J({},this.config,K)})},z.loadTemplate=function(K,Q,B){if(typeof Q=="string")(B&&B.async?this.templatesAsync:this.templatesSync).define(K,this.compile(Q,B));else{var H=this.templatesSync;(Q.constructor.name==="AsyncFunction"||B&&B.async)&&(H=this.templatesAsync),H.define(K,Q)}},q}(),vG=function(q){function z(){return q.apply(this,arguments)||this}return X(z,q),z}(gG);G.Eta=vG})});var W={TEXT:0,TAG_OPEN:1,TAG_CLOSE:2,ATTRIBUTE_NAME:3,ATTRIBUTE_VALUE:4,SELF_CLOSING_TAG:5},oG=new Set(["area","base","br","col","embed","hr","img","input","link","meta","source","track","wbr","att","attr","mutation","intersection"]);class h{constructor(G,J,X,Y){this.tagName=G,this.attributes=J,this.children=X,this.content=Y,this.isRemoved=!1,this.isSelfClosing=!1}html(){if(this.isRemoved)return"";let G=this.content||"";for(let J of this.children)G+=J.html();if(this.isSelfClosing)return`<${this.tagName}${this.getAttributesString()} />`;return`<${this.tagName}${this.getAttributesString()}>${G}</${this.tagName}>`}text(){return this.isRemoved?"":this.content||""}getElementById(G){if(this.isRemoved)return null;if(this.attributes.id===G)return this;for(let J of this.children){const X=J.getElementById(G);if(X)return X}return null}getElementsByClass(G){if(this.isRemoved)return[];const J=[];if(this.attributes.class&&this.attributes.class.split(" ").includes(G))J.push(this);for(let X of this.children)J.push(...X.getElementsByClass(G));return J}remove(){this.isRemoved=!0}unRemove(){this.isRemoved=!1}hidden(){this.attributes.style="display: none;"}show(){if(this.attributes.style)delete this.attributes.style}filterAttributes(G){if(G.includes("*"))return;const J={};for(let[X,Y]of Object.entries(this.attributes))if(G.includes(X))J[X]=Y;this.attributes=J;for(let X of this.children)X.filterAttributes(G)}getAttributesString(){return Object.entries(this.attributes).map(([G,J])=>` ${G}="${J}"`).join("")}static create(G){const J=h.tokenize(G),X=[],Y=[];let Z=null,D={},$="";for(let I of J)switch(I.type){case W.TAG_OPEN:if(Z){if(Object.keys(Z.attributes).length===0)Z.attributes=D;Z.content=$.trim(),D={},$="",Y.push(Z)}Z=new h(I.value,{},[]);break;case W.ATTRIBUTE_NAME:D[I.value]="";break;case W.ATTRIBUTE_VALUE:const M=Object.keys(D).pop();D[M]=I.value;break;case W.TAG_CLOSE:case W.SELF_CLOSING_TAG:if(!Z)break;if(Z.isSelfClosing=I.type===W.SELF_CLOSING_TAG,Object.keys(Z.attributes).length===0)Z.attributes=D;if(!Z.content)Z.content=$;else Z.content+=" "+$;if($="",D={},Y.length>0)Y[Y.length-1].children.push(Z);else X.push(Z);Z=Y.pop()||null;break;case W.TEXT:if(Z)$+=I.value;break}return X}static tokenize(G){const J=[];let X=0;while(X<G.length)if(G[X]==="<")if(G[X+1]==="/"){let Y=X+2;while(Y<G.length&&G[Y]!==">")Y++;J.push({type:W.TAG_CLOSE,value:G.slice(X+2,Y).trim()}),X=Y+1}else{let Y=X+1;while(Y<G.length&&G[Y]!==" "&&G[Y]!==">"&&G[Y]!=="/")Y++;const Z=G.slice(X+1,Y).trim();J.push({type:W.TAG_OPEN,value:G.slice(X+1,Y).trim()});while(Y<G.length&&G[Y]!==">")if(G[Y]===" "){Y++;let D="";while(Y<G.length&&G[Y]!=="="&&G[Y]!==" "&&G[Y]!==">"&&G[Y]!=="/")D+=G[Y],Y++;if(D!=="")J.push({type:W.ATTRIBUTE_NAME,value:D.trim().toLowerCase()});if(G[Y]==="="){Y++;const $=G[Y];Y++;let I="";while(Y<G.length&&G[Y]!==$)I+=G[Y],Y++;J.push({type:W.ATTRIBUTE_VALUE,value:I}),Y++}}else Y++;if(oG.has(Z.toLowerCase())&&G[Y]===">")J.push({type:W.SELF_CLOSING_TAG,value:Z});if(G[Y]===">")Y++;X=Y}else{let Y=X;while(Y<G.length&&G[Y]!=="<")Y++;J.push({type:W.TEXT,value:G.slice(X,Y)}),X=Y}return J}}function $G(G){return Object.keys(s).find((J)=>J.toLowerCase()==G.toLocaleLowerCase())!=null}function HG(G,J){return import("data:text/javascript;charset=utf-8,"+J.join("\n")+encodeURIComponent(`${G}`)).then((Y)=>Y).catch((Y)=>{return console.error(Y),null})}function sG(G){switch(G.data?.___type){case"table":console.table(G.data);break;case"dir":console.dir(G.data);break;case"error":console.error(G.data);break;case"warn":console.warn(G.data);break;default:case"log":console.log(G.data);break}}function xG(G){return G.replace(/<!--[\s\S]*?-->/g,"")}function VG(G){return G.toLowerCase().split("-").map((J)=>J.charAt(0).toUpperCase()+J.slice(1)).join("")}function g(G){EG.postMessage({...G,___type:"warn"})}var s={int:{parse:(G)=>{try{return parseInt(G)}catch(J){return null}},store(G){return`${G}}`}},float:{parse:(G)=>{try{return parseFloat(G)}catch(J){return null}},store(G){return`${G}}`}},string:{parse:(G)=>{return G},store(G){return G}},bigint:{parse:(G)=>{try{return BigInt(G)}catch(J){return null}},store(G){return`${G}}`}},color:{},callback:{parse:(G,J)=>{return()=>new y("$self","refs","data",G)(J,J.refs,J.data)},store(G){return`${G}}`}}};var y=Object.getPrototypeOf(async function(){}).constructor,EG=new BroadcastChannel("advect:log");EG.onmessage=(G)=>sG(G);var SG=["body","iframe","img","link","object","script","style","audio","video"];var GG={async prerender(G){return""},async load({urls:G}){const J=[],X=[];if(Array.isArray(G))X.push(...G);if(typeof G=="string")X.push(G);for(let Y of X){const Z=await fetch(Y).then((D)=>D.text()).then(async(D)=>await GG.build({template:D}));J.push(...Z)}return J},async build({template:G}){const J=xG(G),X=h.create(String.raw`${J}`),Y=[];for(let Z of X){const D={tagName:"",module:"",template:"",templateNode:null,refs:[],root:"light",shadow:"closed",watched_attrs:{},mutation:{attributeFilter:[],attributes:!0,characterData:!1,childList:!0,subtree:!0},intersection:{margin:0.5,threshhold:1},logs:[]};if(Z.tagName.toLowerCase()==="template"){if(!Z.attributes.id){g("advect Template must have an id that will become the tag name");continue}const I=Z.attributes.id;if(I.indexOf("-")===-1){g("advect Template tag name must contain a hyphen");continue}if(D.tagName=I,D.templateNode=Z,Z.attributes.root)D.root=Z.attributes.root;else D.root="light";if(Z.attributes.shadow)D.shadow=Z.attributes.shadow;else D.shadow="closed";const M=[...Z.children];while(M.length>0){const F=M.shift();if(!F)continue;if(F.tagName==="adv-settings")F.children.forEach((O)=>{if(O.tagName=="adv-mutation"){if(D?.mutation?.attributeFilter&&O.attributes.attributeFilter)D.mutation.attributeFilter=O.attributes.attributeFilter.split(",");if(D?.mutation?.attributes&&O.attributes.attributes)D.mutation.attributes=O.attributes.attributes.toLocaleLowerCase().indexOf("true")!=-1;if(D?.mutation?.characterData&&O.attributes.characterData)D.mutation.characterData=O.attributes.characterData.toLocaleLowerCase().indexOf("true")!=-1;if(D?.mutation?.childList&&O.attributes.childList)D.mutation.childList=O.attributes.childList.toLocaleLowerCase().indexOf("true")!=-1;if(D?.mutation?.subtree&&O.attributes.subtree)D.mutation.subtree=O.attributes.subtree.toLocaleLowerCase().indexOf("true")!=-1}if(O.tagName=="adv-intersection"){if(D?.intersection&&O.attributes.margin)D.intersection.margin=parseFloat(O.attributes.margin);if(D?.intersection.threshhold&&O.attributes.threshhold)D.intersection.threshhold=parseFloat(O.attributes.threshhold);if(D?.intersection.root&&O.attributes.root)D.intersection.root=O.attributes.root}if(O.tagName=="adv-attr"&&O.attributes.name){const V=O.attributes.name,S=O.attributes.type??"string";if($G(S))D.watched_attrs[V]={type:S}}O.remove()}),F.remove();if(F.tagName==="script"){if(F.attributes.type?.toLocaleLowerCase()==="text/adv"&&F.attributes.type){const O=new URL(F.attributes.src);this.load({urls:O.toString()})}if(F.attributes.type?.toLocaleLowerCase()==="module"&&!F.attributes.src)D.module=F.text()}if(F.attributes.ref)D.refs.push(F);M.push(...F.children)}}const $=Z.children.map((I)=>I.html()).join("");D.template=$,Y.push(D)}return Y}};var XG=OG(RG(),1);var AG=OG(PG(),1);function JG(G,J){const[X,Y]=J.tags,Z=J.parse.exec,D=F(G),$=O(D),I=V($),M=S(I);function F(L){return L.replace(/&gt;/g,">").replace(/&lt;/g,"<").replace(/&amp;/g,"&")}function O(L){return L.replace(/<if check="([^"]+)">/g,`${X}${Z} if ( \$1 ) { ${Y}`).replace(/<else\/?>/g,`${X}${Z} } else { ${Y}`).replace(/<\/if>/g,`${X}${Z} } ${Y}`)}function V(L){return L.replace(/<for data="([^"]+)"(?: name="([^"]+)")?(?: index="([^"]+)")?>/g,function(k,R,P,j){if(P&&j)return`${X}${Z} ${R}.forEach(function(${P}, ${j}){ ${Y}`;else if(P)return`${X}${Z} ${R}.forEach(function(${P}){ ${Y}`;else return`${X}${Z} ${R}.forEach(function(){ ${Y}`}).replace(/<\/for>/g,`${X}${Z} }); ${Y}`)}function S(L){return L.replace(/<of data="([^"]+)"(?: name="([^"]+)")?(?: value="([^"]+)")?>/g,function(k,R,P,j){if(P&&j)return`${X}${Z} Object.keys(${R}).forEach(function(${P}) { ${Y} 
                        ${X}${Z} const ${j} = ${R}[${P}] ${Y}
                    `;else if(P)return`${X}${Z} Object.keys(${R}).forEach(function(${P}) { ${Y}`;else return`${X}${Z} Object.keys(${R}).forEach(function() { ${Y}`}).replace(/<\/of>/g,`${X}${Z} }); ${Y}`)}return M}function UG(G){const J={"<t-table":"<table","</t-table>":"</table>","<t-head":"<thead","</t-head>":"</thead>","<t-body":"<tbody","</t-body>":"</tbody>","<t-foot":"<tfoot","</t-foot>":"</tfoot>","<t-r":"<tr","</t-r>":"</tr>","<t-d":"<td","</t-d>":"</td>","<t-h":"<th","</t-h>":"</th>"};return G.replaceAll("<t-table","<table").replaceAll("</t-table>","</table>").replaceAll("<t-head","<thead").replaceAll("</t-head>","</thead>").replaceAll("<t-body","<tbody").replaceAll("</t-body>","</tbody>").replaceAll("<t-foot","<tfoot").replaceAll("</t-foot>","</tfoot>").replaceAll("<t-r","<tr").replaceAll("</t-r>","</tr>").replaceAll("<t-d","<td").replaceAll("</t-d>","</td>").replaceAll("<t-h","<th").replaceAll("</t-h>","</th>")}var CG=(G)=>{let J;const X=new Set,Y=(F,O)=>{const V=typeof F==="function"?F(J):F;if(!Object.is(V,J)){const S=J;J=(O!=null?O:typeof V!=="object"||V===null)?V:Object.assign({},J,V),X.forEach((L)=>L(J,S))}},Z=()=>J,I={setState:Y,getState:Z,getInitialState:()=>M,subscribe:(F)=>{return X.add(F),()=>X.delete(F)}},M=J=G(Y,Z,I);return I},bG=(G)=>G?CG(G):CG;function wG(G){return new Promise((J,X)=>{if(!G.isConnected){J(null);return}if(G.tagName.indexOf("-")==-1){J(G);return}if(!G.matches(":defined"))customElements.whenDefined(G.tagName).then((D)=>{J(G)}).catch((D)=>{X(D)});J(G)})}var rG=async()=>{const G=new Map,J=await XG.default(new URL("advect.sharedworker.js",import.meta.url).href),X=new SharedWorker(J,{type:"module"});return X.onerror=(Z)=>{console.warn("error",Z)},X.port.onmessage=(Z)=>{const D=G.has(Z.data.$id)&&G.get(Z.data.$id);if(Z.data?.isError===!0&&D)D.reject(Z);if(D)D.resolve(Z),G.delete(Z.data.$id)},{messagePromise:async(Z,D)=>{return new Promise(($,I)=>{const M=Math.random().toString(36).substr(2,9);G.set(M,{resolve:$,reject:I}),X.port.postMessage({action:Z,data:D,$id:M})})},worker:X,type:"shared"}},nG=async()=>{const G=new Map,J=await XG.default(new URL("advect.worker.js",import.meta.url).href),X=new Worker(J,{type:"module"});return X.onerror=(Z)=>{console.error("error",Z)},X.onmessage=(Z)=>{const D=G.has(Z.data.$id)&&G.get(Z.data.$id);if(Z.data?.isError===!0&&D)D.reject(Z);if(D)D.resolve(Z),G.delete(Z.data.$id)},{messagePromise:async(Z,D)=>{return new Promise(($,I)=>{const M=Math.random().toString(36).substr(2,9);G.set(M,{resolve:$,reject:I}),X.postMessage({action:Z,data:D,$id:M})})},worker:X,type:"dedicated"}},tG=()=>{const G=new BroadcastChannel("advect:noworker"),J=new BroadcastChannel("advect:noworker");G.onmessageerror=(Z)=>console.error(Z),G.onmessage=(Z)=>{const D=X.has(Z.data.$id)&&X.get(Z.data.$id);if(Z.data?.isError===!0&&D)D.reject(Z);if(D)GG[Z.data.action].call(null,Z.data.data).then(($)=>{Z.data.result=$,D.resolve(Z),X.delete(Z.data.$id)})};const X=new Map;return{messagePromise:async(Z,D)=>{return new Promise(($,I)=>{const M=Math.random().toString(36).substr(2,9);X.set(M,{resolve:$,reject:I}),J.postMessage({action:Z,data:D,$id:M})})},worker:null,type:"no-worker"}},eG=async()=>{const G=new URL(import.meta.url).searchParams.get("type")?.toLocaleLowerCase();let J;switch(G){case"d":J=(await nG()).messagePromise;break;case"s":J=(await rG()).messagePromise;break;default:J=tG().messagePromise;break}const X=async(I)=>{return J("prerender",I)},Y=async(I)=>{const F=(await J("load",{urls:I})).data.result;return Z(F)},Z=(I,M=!0)=>{const F=[];for(let O of I){const V=O;HG(O.module,[]).then((S)=>{const L=VG(O.tagName),k=S[L],R=class extends(k||ZG){static observedAttributes=Object.keys(V.watched_attrs);static settings=V};if(M&&V.tagName.length>3&&V.tagName.indexOf("-"))customElements.define(V.tagName,R);F.push(R)})}return F},D=async(I)=>{const F=(await J("build",{template:I})).data.result;return Z(F)},$=(I)=>{document.querySelectorAll("template[id][adv]").forEach((F)=>D(F.outerHTML));let M=[];document.querySelectorAll('script[type="text/adv"][src]').forEach((F)=>{if(F.hasAttribute("src"))M.push(F.getAttribute("src")??"")}),Y(M),document.removeEventListener("DOMContentLoaded",$)};if(document.readyState!=="loading")$(null);else document.addEventListener("DOMContentLoaded",$);return{render:X,build:D,load:Y}};class YG extends HTMLElement{anyAttrChanged(G,J){}attr=new Proxy({},{get:(G,J)=>{if(this.isConnected)return this.getAttribute(J);return null},set:(G,J,X)=>{if(this.isConnected)return this.setAttribute(J,X),this.anyAttrChanged(J,X),!0;return!1}});data=new Proxy({},{get:(G,J)=>{if(this.isConnected)return this.dataset[J];return null},set:(G,J,X)=>{if(this.isConnected)return this.dataset[J]=X,this.anyAttrChanged("data-"+J,X),!0;return!1}});#G;get internals(){return this.#G}constructor(){super()}onAdopt=()=>{};adoptedCallback(){this?.onAdopt()}onAttributeChange=(G,J,X)=>{};attributeChangedCallback(G,J,X){this?.onAttributeChange(G,J,X)}onConnect=()=>{};connectedCallback(){this.#G=this.attachInternals(),this.dispatchEvent(new CustomEvent("connect"))}addEventListener(G,J,X){if(super.addEventListener(G,J,X),G=="connect"&&this.isConnected)J(new Event("connect",{}))}onDisconnect=()=>{};disconnectedCallback(){this?.onDisconnect()}onMutation=(G)=>{};onIntersect=(G)=>{}}class ZG extends YG{get html(){return this.$settings.template}get refs_list(){return this.$settings.refs}get all_refs(){return[...this.querySelectorAll("[ref]"),...this?.shadowRoot?.querySelectorAll("[ref]")]}refs=new Proxy({},{get:(G,J)=>{const X=this.querySelector(`[ref="${J}"]`)||this?.shadowRoot?.querySelector(`[ref="${J}"]`);if(X)return X;return null}});fuzzyRefs=new Proxy({},{get:(G,J)=>{const X=this.querySelector(`[ref="${J}"]`)||this?.shadowRoot?.querySelector(`[ref="${J}"]`);if(X)return wG(X);return null}});get $settings(){return this.constructor.settings}typed=new Proxy({},{get:(G,J)=>{if(this.isConnected){try{let X=this.getAttribute(J);const Y=this.$settings.watched_attrs[J].type;if(!Y)return X;const Z=s[Y]??s.string;if(Y=="callback")return Z.parse(X,this)}catch(X){console.warn(X)}return handler.parse(val)}return null},set:(G,J,X)=>{if(this.isConnected){if(!this.$settings.watched_attrs[J])return!1;return this.setAttribute(J,X),this.anyAttrChanged(J,X),!0}return!1}});constructor(){super()}connectedCallback(){super.connectedCallback(),this.#G(),this.#z(),this?.onConnect()}#G(){switch(this.$settings?.root){case"none":break;case"shadow":if(this.attachShadow({mode:this.$settings.shadow}),this.shadowRoot)this.shadowRoot.innerHTML='<div style="display:contents;" part="root">'+this.html+"</div>";break;default:case"light":this.innerHTML=this.html;break}}hookRef(G){if(this.mutationObserver?.observe(G,{attributes:!0,childList:!0,subtree:!0}),Object.defineProperty(G,"binder",{value:this,writable:!1}),G.getAttributeNames().filter((X)=>X.startsWith("on")).forEach((X)=>{const Y=G.getAttribute(X)??"";if(X.toLowerCase()==="onmutate")G.addEventListener("adv:mutation",(Z)=>{try{new y("$self","event","$this","refs","data",Y)(this,Z,G,this.refs,this.data)}catch(D){console.error(D,Y,this)}});else try{G[X]=(Z)=>{new y("$self","event","$this","refs","data",Y)(this,Z,G,this.refs,this.data)}}catch(Z){console.error(Z,Y,this)}}),G.matches("[onload]")&&!SG.find((X)=>X===G.tagName.toLocaleLowerCase()))G.dispatchEvent(new Event("load",{bubbles:!1}))}#J(){this.shadowRoot?.querySelectorAll("[ref]").forEach((G)=>{this.hookRef(G)})}#Z(){this?.querySelectorAll("[ref]").forEach((G)=>{this.hookRef(G)})}#q(){this.getAttributeNames().filter((G)=>G.startsWith("on")).forEach((G)=>{const J=this.getAttribute(G)??"";if(G.toLowerCase()==="onmutate"){this.onMutation=(X)=>new y("$self","event",J)(this,X);return}this[G]=(X)=>new y("$self","event",J)(this,X)})}#z(){this.#q(),this.#Z(),this.#J()}#X;get mutationObserver(){return this.#X}createMutationObserver(){if(this.$settings.mutation){if(this.#X=new MutationObserver((G,J)=>{this?.onMutation(G)}),this.#X.observe(this,{...this.$settings.mutation}),this.shadowRoot)this.#X.observe(this.shadowRoot,{...this.$settings.mutation})}}#Y;get interectObserver(){return this.#Y}createIntersectObserver(){if(this.$settings.intersection){let G=void 0;if(this.$settings?.intersection?.root)G=this.querySelector(this.$settings?.intersection?.root);this.#Y=new IntersectionObserver((J,X)=>{this.onIntersect(J)},{...this.$settings.intersection,root:G})}}}class qG extends YG{anyAttrChanged(G,J){this.render()}#G=new AG.Eta({useWith:!0,tags:["{{","}}"],parse:{exec:">",interpolate:"",raw:"~"}});#J=bG((G,J)=>({}));get store(){return this.#J}get state(){return this.#J?.getState()}viewTransition=!0;refs=new Proxy({},{get:(G,J)=>{const X=this?.shadowRoot?.querySelector(`[ref="${J}"]`);if(X)return X;return null}});fuzzyRefs=new Proxy({},{get:(G,J)=>{const X=this?.shadowRoot?.querySelector(`[ref="${J}"]`);if(X)return wG(X);return null}});get all_refs(){return[...this?.shadowRoot?.querySelectorAll("[ref]")]}connectedCallback(){super.connectedCallback(),this.#J.subscribe((G,J)=>{this.render()}),requestAnimationFrame(()=>{this.render()})}get eta(){return this.#G}render(){}onRender=()=>{};afterRender(){if(this.onRender)this.onRender()}}class TG extends qG{render(){const G=this.querySelector("template"),J=this.querySelector("[output]"),X=JG(G?.innerHTML??"",this.eta.config);let Y="";try{Y=UG(this.eta.renderString(X,{$self:this}))}catch(Z){console.log(Z)}if(this.viewTransition)document.startViewTransition(()=>{if(J)J.innerHTML=Y}).finished.then(()=>{this.afterRender()});else if(J)J.innerHTML=Y,requestAnimationFrame(()=>{this.afterRender()})}}class NG extends qG{connectedCallback(){this.attachShadow({mode:"open"}),super.connectedCallback()}render(){const G=JG(this.innerHTML,this.eta.config);let J="";try{J=this.eta.renderString(G,{$self:this})}catch(Y){g(Y)}const X=`<div style="display:contents;" part="root">${J}</div>`;if(this.shadowRoot){const Y=this.shadowRoot;if(this.viewTransition)document.startViewTransition(()=>{Y.innerHTML=X}).finished.then(()=>{this.afterRender()});else Y.innerHTML=X,requestAnimationFrame(()=>{this.afterRender()})}}}if(!customElements.get("adv-view"))customElements.define("adv-view",TG);if(!customElements.get("adv-shadow-view"))customElements.define("adv-shadow-view",NG);window.AdvectElement=ZG;var MJ=await eG();export{wG as refHandle,MJ as advect,TG as AdvectView,NG as AdvectShadowView,ZG as AdvectElement,YG as AdvectBase};
