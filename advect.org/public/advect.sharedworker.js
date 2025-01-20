var E=Object.create;var{getPrototypeOf:Q,defineProperty:K,getOwnPropertyNames:R}=Object;var V=Object.prototype.hasOwnProperty;var w=(x,F,G)=>{G=x!=null?E(Q(x)):{};const z=F||!x||!x.__esModule?K(G,"default",{value:x,enumerable:!0}):G;for(let B of R(x))if(!V.call(z,B))K(z,B,{get:()=>x[B],enumerable:!0});return z};var H=(x,F)=>()=>(F||x((F={exports:{}}).exports,F),F.exports);var W={TEXT:0,TAG_OPEN:1,TAG_CLOSE:2,ATTRIBUTE_NAME:3,ATTRIBUTE_VALUE:4,SELF_CLOSING_TAG:5},f=new Set(["area","base","br","col","embed","hr","img","input","link","meta","source","track","wbr","att","attr","mutation","intersection"]);class Y{constructor(x,F,G,z){this.tagName=x,this.attributes=F,this.children=G,this.content=z,this.isRemoved=!1,this.isSelfClosing=!1}html(){if(this.isRemoved)return"";let x=this.content||"";for(let F of this.children)x+=F.html();if(this.isSelfClosing)return`<${this.tagName}${this.getAttributesString()} />`;return`<${this.tagName}${this.getAttributesString()}>${x}</${this.tagName}>`}text(){return this.isRemoved?"":this.content||""}getElementById(x){if(this.isRemoved)return null;if(this.attributes.id===x)return this;for(let F of this.children){const G=F.getElementById(x);if(G)return G}return null}getElementsByClass(x){if(this.isRemoved)return[];const F=[];if(this.attributes.class&&this.attributes.class.split(" ").includes(x))F.push(this);for(let G of this.children)F.push(...G.getElementsByClass(x));return F}remove(){this.isRemoved=!0}unRemove(){this.isRemoved=!1}hidden(){this.attributes.style="display: none;"}show(){if(this.attributes.style)delete this.attributes.style}filterAttributes(x){if(x.includes("*"))return;const F={};for(let[G,z]of Object.entries(this.attributes))if(x.includes(G))F[G]=z;this.attributes=F;for(let G of this.children)G.filterAttributes(x)}getAttributesString(){return Object.entries(this.attributes).map(([x,F])=>` ${x}="${F}"`).join("")}static create(x){const F=Y.tokenize(x),G=[],z=[];let B=null,J={},S="";for(let U of F)switch(U.type){case W.TAG_OPEN:if(B){if(Object.keys(B.attributes).length===0)B.attributes=J;B.content=S.trim(),J={},S="",z.push(B)}B=new Y(U.value,{},[]);break;case W.ATTRIBUTE_NAME:J[U.value]="";break;case W.ATTRIBUTE_VALUE:const P=Object.keys(J).pop();J[P]=U.value;break;case W.TAG_CLOSE:case W.SELF_CLOSING_TAG:if(!B)break;if(B.isSelfClosing=U.type===W.SELF_CLOSING_TAG,Object.keys(B.attributes).length===0)B.attributes=J;if(!B.content)B.content=S;else B.content+=" "+S;if(S="",J={},z.length>0)z[z.length-1].children.push(B);else G.push(B);B=z.pop()||null;break;case W.TEXT:if(B)S+=U.value;break}return G}static tokenize(x){const F=[];let G=0;while(G<x.length)if(x[G]==="<")if(x[G+1]==="/"){let z=G+2;while(z<x.length&&x[z]!==">")z++;F.push({type:W.TAG_CLOSE,value:x.slice(G+2,z).trim()}),G=z+1}else{let z=G+1;while(z<x.length&&x[z]!==" "&&x[z]!==">"&&x[z]!=="/")z++;const B=x.slice(G+1,z).trim();F.push({type:W.TAG_OPEN,value:x.slice(G+1,z).trim()});while(z<x.length&&x[z]!==">")if(x[z]===" "){z++;let J="";while(z<x.length&&x[z]!=="="&&x[z]!==" "&&x[z]!==">"&&x[z]!=="/")J+=x[z],z++;if(J!=="")F.push({type:W.ATTRIBUTE_NAME,value:J.trim().toLowerCase()});if(x[z]==="="){z++;const S=x[z];z++;let U="";while(z<x.length&&x[z]!==S)U+=x[z],z++;F.push({type:W.ATTRIBUTE_VALUE,value:U}),z++}}else z++;if(f.has(B.toLowerCase())&&x[z]===">")F.push({type:W.SELF_CLOSING_TAG,value:B});if(x[z]===">")z++;G=z}else{let z=G;while(z<x.length&&x[z]!=="<")z++;F.push({type:W.TEXT,value:x.slice(G,z)}),G=z}return F}}function O(x){return Object.keys(C).find((F)=>F.toLowerCase()==x.toLocaleLowerCase())!=null}function v(x,F){return import("data:text/javascript;charset=utf-8,"+F.join("\n")+encodeURIComponent(`${x}`)).then((z)=>z).catch((z)=>{return console.error(z),null})}function M(x){switch(x.data?.___type){case"table":console.table(x.data);break;case"dir":console.dir(x.data);break;case"error":console.error(x.data);break;case"warn":console.warn(x.data);break;default:case"log":console.log(x.data);break}}function X(x){q.postMessage({...x,___type:"log"})}var C={number:{},string:{},bigint:{},color:{}};var b=Object.getPrototypeOf(async function(){}).constructor,q=new BroadcastChannel("advect:log");q.onmessage=(x)=>M(x);var Z={async prerender(x){return X({renderDesc:x}),""},async load({urls:x}){X({message:"starting my loading",urls:x});const F=[],G=[];if(Array.isArray(x))G.push(...x);if(typeof x=="string")G.push(x);for(let z of G){const B=await fetch(z).then((J)=>J.text()).then(async(J)=>await this.build({template:J}));X({msg:"wow loading some stuff",url:z,data:B}),F.push(...B)}return X({message:"done loading",urls:x}),F},async build({template:x}){const F=Y.create(String.raw`${x}`),G=[];X({message:"building",template:x,root_nodes:F});for(let z of F){X({message:"Adding",root_node:z.attributes.id});const B={tagName:"",module:"",template:"",templateNode:null,refs:[],root:"light",shadow:"closed",watched_attrs:{},mutation:{attributeFilter:[],attributes:!0,characterData:!1,childList:!0,subtree:!0},intersection:{margin:0.5,threshhold:1},logs:[]};if(z.tagName.toLowerCase()==="template"){if(!z.attributes.id){X("advect Template must have an id that will become the tag name");continue}const S=z.attributes.id;if(S.indexOf("-")===-1){X("advect Template tag name must contain a hyphen");continue}if(B.tagName=S,B.templateNode=z,z.attributes.root)B.root=z.attributes.root;else B.root="light";if(z.attributes.shadow)B.shadow=z.attributes.shadow;else B.shadow="closed";const U=[...z.children];while(U.length>0){const P=U.shift();if(!P)continue;if(P.tagName==="settings")P.children.forEach((I)=>{if(I.tagName=="mutation"){if(B?.mutation?.attributeFilter&&I.attributes.attributeFilter)B.mutation.attributeFilter=I.attributes.attributeFilter.split(",");if(B?.mutation?.attributes&&I.attributes.attributes)B.mutation.attributes=I.attributes.attributes.toLocaleLowerCase().indexOf("true")!=-1;if(B?.mutation?.characterData&&I.attributes.characterData)B.mutation.characterData=I.attributes.characterData.toLocaleLowerCase().indexOf("true")!=-1;if(B?.mutation?.childList&&I.attributes.childList)B.mutation.childList=I.attributes.childList.toLocaleLowerCase().indexOf("true")!=-1;if(B?.mutation?.subtree&&I.attributes.subtree)B.mutation.subtree=I.attributes.subtree.toLocaleLowerCase().indexOf("true")!=-1}if(I.tagName=="intersection"){if(B?.intersection&&I.attributes.margin)B.intersection.margin=parseFloat(I.attributes.margin);if(B?.intersection.threshhold&&I.attributes.threshhold)B.intersection.threshhold=parseFloat(I.attributes.threshhold);if(B?.intersection.root&&I.attributes.root)B.intersection.root=I.attributes.root}if(I.tagName=="attr"&&I.attributes.name){const D=I.attributes.name,$=I.attributes.type??"string";if(O($))B.watched_attrs[D]={type:$}}I.remove()}),P.remove();if(P.tagName==="script"){if(P.attributes.type.toLocaleLowerCase()==="text/adv"&&P.attributes.type){const I=new URL(P.attributes.src);this.load({urls:I.toString()})}if(P.attributes.type.toLocaleLowerCase()==="module"&&!P.attributes.src)B.module=P.text()}if(P.attributes.ref)B.refs.push(P);U.push(...P.children)}}const J=z.children.map((S)=>S.html()).join("");B.template=J,G.push(B)}return G}};onconnect=(x)=>{const F=x.ports[0];F.addEventListener("message",(G)=>{try{const{data:z}=G;if(z&&z?.action&&Z[z.action])try{Z[z.action](z.data).then((B)=>{F.postMessage({action:z.action,result:B,$id:z.$id})})}catch(B){console.log(B),F.postMessage({action:z.action,result:B,$id:z.$id,isError:!0})}else console.warn("Unknown action",z)}catch(z){}}),F.start()};
