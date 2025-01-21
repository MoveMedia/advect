var D=Object.create;var{getPrototypeOf:R,defineProperty:$,getOwnPropertyNames:Q}=Object;var V=Object.prototype.hasOwnProperty;var M=(x,E,F)=>{F=x!=null?D(R(x)):{};const z=E||!x||!x.__esModule?$(F,"default",{value:x,enumerable:!0}):F;for(let B of Q(x))if(!V.call(z,B))$(z,B,{get:()=>x[B],enumerable:!0});return z};var H=(x,E)=>()=>(E||x((E={exports:{}}).exports,E),E.exports);var S={TEXT:0,TAG_OPEN:1,TAG_CLOSE:2,ATTRIBUTE_NAME:3,ATTRIBUTE_VALUE:4,SELF_CLOSING_TAG:5},f=new Set(["area","base","br","col","embed","hr","img","input","link","meta","source","track","wbr","att","attr","mutation","intersection"]);class W{constructor(x,E,F,z){this.tagName=x,this.attributes=E,this.children=F,this.content=z,this.isRemoved=!1,this.isSelfClosing=!1}html(){if(this.isRemoved)return"";let x=this.content||"";for(let E of this.children)x+=E.html();if(this.isSelfClosing)return`<${this.tagName}${this.getAttributesString()} />`;return`<${this.tagName}${this.getAttributesString()}>${x}</${this.tagName}>`}text(){return this.isRemoved?"":this.content||""}getElementById(x){if(this.isRemoved)return null;if(this.attributes.id===x)return this;for(let E of this.children){const F=E.getElementById(x);if(F)return F}return null}getElementsByClass(x){if(this.isRemoved)return[];const E=[];if(this.attributes.class&&this.attributes.class.split(" ").includes(x))E.push(this);for(let F of this.children)E.push(...F.getElementsByClass(x));return E}remove(){this.isRemoved=!0}unRemove(){this.isRemoved=!1}hidden(){this.attributes.style="display: none;"}show(){if(this.attributes.style)delete this.attributes.style}filterAttributes(x){if(x.includes("*"))return;const E={};for(let[F,z]of Object.entries(this.attributes))if(x.includes(F))E[F]=z;this.attributes=E;for(let F of this.children)F.filterAttributes(x)}getAttributesString(){return Object.entries(this.attributes).map(([x,E])=>` ${x}="${E}"`).join("")}static create(x){const E=W.tokenize(x),F=[],z=[];let B=null,I={},O="";for(let P of E)switch(P.type){case S.TAG_OPEN:if(B){if(Object.keys(B.attributes).length===0)B.attributes=I;B.content=O.trim(),I={},O="",z.push(B)}B=new W(P.value,{},[]);break;case S.ATTRIBUTE_NAME:I[P.value]="";break;case S.ATTRIBUTE_VALUE:const J=Object.keys(I).pop();I[J]=P.value;break;case S.TAG_CLOSE:case S.SELF_CLOSING_TAG:if(!B)break;if(B.isSelfClosing=P.type===S.SELF_CLOSING_TAG,Object.keys(B.attributes).length===0)B.attributes=I;if(!B.content)B.content=O;else B.content+=" "+O;if(O="",I={},z.length>0)z[z.length-1].children.push(B);else F.push(B);B=z.pop()||null;break;case S.TEXT:if(B)O+=P.value;break}return F}static tokenize(x){const E=[];let F=0;while(F<x.length)if(x[F]==="<")if(x[F+1]==="/"){let z=F+2;while(z<x.length&&x[z]!==">")z++;E.push({type:S.TAG_CLOSE,value:x.slice(F+2,z).trim()}),F=z+1}else{let z=F+1;while(z<x.length&&x[z]!==" "&&x[z]!==">"&&x[z]!=="/")z++;const B=x.slice(F+1,z).trim();E.push({type:S.TAG_OPEN,value:x.slice(F+1,z).trim()});while(z<x.length&&x[z]!==">")if(x[z]===" "){z++;let I="";while(z<x.length&&x[z]!=="="&&x[z]!==" "&&x[z]!==">"&&x[z]!=="/")I+=x[z],z++;if(I!=="")E.push({type:S.ATTRIBUTE_NAME,value:I.trim().toLowerCase()});if(x[z]==="="){z++;const O=x[z];z++;let P="";while(z<x.length&&x[z]!==O)P+=x[z],z++;E.push({type:S.ATTRIBUTE_VALUE,value:P}),z++}}else z++;if(f.has(B.toLowerCase())&&x[z]===">")E.push({type:S.SELF_CLOSING_TAG,value:B});if(x[z]===">")z++;F=z}else{let z=F;while(z<x.length&&x[z]!=="<")z++;E.push({type:S.TEXT,value:x.slice(F,z)}),F=z}return E}}function q(x){return Object.keys(C).find((E)=>E.toLowerCase()==x.toLocaleLowerCase())!=null}function v(x,E){return import("data:text/javascript;charset=utf-8,"+E.join("\n")+encodeURIComponent(`${x}`)).then((z)=>z).catch((z)=>{return console.error(z),null})}function w(x){switch(x.data?.___type){case"table":console.table(x.data);break;case"dir":console.dir(x.data);break;case"error":console.error(x.data);break;case"warn":console.warn(x.data);break;default:case"log":console.log(x.data);break}}function U(x){X.postMessage({...x,___type:"log"})}function y(x){X.postMessage({...x,___type:"warn"})}var C={number:{},string:{},bigint:{},color:{}};var b=Object.getPrototypeOf(async function(){}).constructor,X=new BroadcastChannel("advect:log");X.onmessage=(x)=>w(x);var Y={async prerender(x){return U({renderDesc:x}),""},async load({urls:x}){U({message:"starting my loading",urls:x});const E=[],F=[];if(Array.isArray(x))F.push(...x);if(typeof x=="string")F.push(x);for(let z of F){const B=await fetch(z).then((I)=>I.text()).then(async(I)=>await this.build({template:I}));U({msg:"wow loading some stuff",url:z,data:B}),E.push(...B)}return U({message:"done loading",urls:x}),E},async build({template:x}){const E=W.create(String.raw`${x}`),F=[];U({message:"building",template:x,root_nodes:E});for(let z of E){U({message:"Adding",root_node:z.attributes.id});const B={tagName:"",module:"",template:"",templateNode:null,refs:[],root:"light",shadow:"closed",watched_attrs:{},mutation:{attributeFilter:[],attributes:!0,characterData:!1,childList:!0,subtree:!0},intersection:{margin:0.5,threshhold:1},logs:[]};if(z.tagName.toLowerCase()==="template"){if(!z.attributes.id){U("advect Template must have an id that will become the tag name");continue}const O=z.attributes.id;if(O.indexOf("-")===-1){U("advect Template tag name must contain a hyphen");continue}if(B.tagName=O,B.templateNode=z,z.attributes.root)B.root=z.attributes.root;else B.root="light";if(z.attributes.shadow)B.shadow=z.attributes.shadow;else B.shadow="closed";const P=[...z.children];while(P.length>0){const J=P.shift();if(!J)continue;if(J.tagName==="settings")J.children.forEach((G)=>{if(G.tagName=="mutation"){if(B?.mutation?.attributeFilter&&G.attributes.attributeFilter)B.mutation.attributeFilter=G.attributes.attributeFilter.split(",");if(B?.mutation?.attributes&&G.attributes.attributes)B.mutation.attributes=G.attributes.attributes.toLocaleLowerCase().indexOf("true")!=-1;if(B?.mutation?.characterData&&G.attributes.characterData)B.mutation.characterData=G.attributes.characterData.toLocaleLowerCase().indexOf("true")!=-1;if(B?.mutation?.childList&&G.attributes.childList)B.mutation.childList=G.attributes.childList.toLocaleLowerCase().indexOf("true")!=-1;if(B?.mutation?.subtree&&G.attributes.subtree)B.mutation.subtree=G.attributes.subtree.toLocaleLowerCase().indexOf("true")!=-1}if(G.tagName=="intersection"){if(B?.intersection&&G.attributes.margin)B.intersection.margin=parseFloat(G.attributes.margin);if(B?.intersection.threshhold&&G.attributes.threshhold)B.intersection.threshhold=parseFloat(G.attributes.threshhold);if(B?.intersection.root&&G.attributes.root)B.intersection.root=G.attributes.root}if(G.tagName=="attr"&&G.attributes.name){const K=G.attributes.name,Z=G.attributes.type??"string";if(q(Z))B.watched_attrs[K]={type:Z}}G.remove()}),J.remove();if(J.tagName==="script"){if(J.attributes.type.toLocaleLowerCase()==="text/adv"&&J.attributes.type){const G=new URL(J.attributes.src);this.load({urls:G.toString()})}if(J.attributes.type.toLocaleLowerCase()==="module"&&!J.attributes.src)B.module=J.text()}if(J.attributes.ref)B.refs.push(J);P.push(...J.children)}}const I=z.children.map((O)=>O.html()).join("");B.template=I,F.push(B)}return F}};onmessage=(x)=>{const{data:E}=x;if(E&&E.action&&Y[E.action])try{Y[E.action].call(null,E.data).then((F)=>{postMessage({action:E.action,result:F,$id:E.$id})})}catch(F){postMessage({action:E.action,result:F,$id:E.$id,isError:!0})}else console.warn("Unknown action",E)};
