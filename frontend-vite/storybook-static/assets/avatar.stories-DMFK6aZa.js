import{j as a}from"./jsx-runtime-Z5uAzocK.js";import{r as d}from"./index-pP6CS22B.js";import{u as ta}from"./index-DSMx10ar.js";import{u as F}from"./index-xdNYasdH.js";import"./index-Bvak3XBe.js";import{c as sa}from"./index-cAPKYzjE.js";import{s as na}from"./index-C_BnrBF9.js";import{c as y}from"./utils-BLSKlp9E.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-x8NkB57A.js";function ca(e,r=[]){let s=[];function c(t,l){const n=d.createContext(l);n.displayName=t+"Context";const i=s.length;s=[...s,l];const v=g=>{var I;const{scope:h,children:S,...x}=g,A=((I=h==null?void 0:h[e])==null?void 0:I[i])||n,ra=d.useMemo(()=>x,Object.values(x));return a.jsx(A.Provider,{value:ra,children:S})};v.displayName=t+"Provider";function p(g,h){var A;const S=((A=h==null?void 0:h[e])==null?void 0:A[i])||n,x=d.useContext(S);if(x)return x;if(l!==void 0)return l;throw new Error(`\`${g}\` must be used within \`${t}\``)}return[v,p]}const o=()=>{const t=s.map(l=>d.createContext(l));return function(n){const i=(n==null?void 0:n[e])||t;return d.useMemo(()=>({[`__scope${e}`]:{...n,[e]:i}}),[n,i])}};return o.scopeName=e,[c,oa(o,...r)]}function oa(...e){const r=e[0];if(e.length===1)return r;const s=()=>{const c=e.map(o=>({useScope:o(),scopeName:o.scopeName}));return function(t){const l=c.reduce((n,{useScope:i,scopeName:v})=>{const g=i(t)[`__scope${v}`];return{...n,...g}},{});return d.useMemo(()=>({[`__scope${r.scopeName}`]:l}),[l])}};return s.scopeName=r.scopeName,s}var la=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"],L=la.reduce((e,r)=>{const s=sa(`Primitive.${r}`),c=d.forwardRef((o,t)=>{const{asChild:l,...n}=o,i=l?s:r;return typeof window<"u"&&(window[Symbol.for("radix-ui")]=!0),a.jsx(i,{...n,ref:t})});return c.displayName=`Primitive.${r}`,{...e,[r]:c}},{});function da(){return na.useSyncExternalStore(ia,()=>!0,()=>!1)}function ia(){return()=>{}}var C="Avatar",[ua]=ca(C),[ma,X]=ua(C),q=d.forwardRef((e,r)=>{const{__scopeAvatar:s,...c}=e,[o,t]=d.useState("idle");return a.jsx(ma,{scope:s,imageLoadingStatus:o,onImageLoadingStatusChange:t,children:a.jsx(L.span,{...c,ref:r})})});q.displayName=C;var K="AvatarImage",V=d.forwardRef((e,r)=>{const{__scopeAvatar:s,src:c,onLoadingStatusChange:o=()=>{},...t}=e,l=X(K,s),n=va(c,t),i=ta(v=>{o(v),l.onImageLoadingStatusChange(v)});return F(()=>{n!=="idle"&&i(n)},[n,i]),n==="loaded"?a.jsx(L.img,{...t,ref:r,src:c}):null});V.displayName=K;var Q="AvatarFallback",Y=d.forwardRef((e,r)=>{const{__scopeAvatar:s,delayMs:c,...o}=e,t=X(Q,s),[l,n]=d.useState(c===void 0);return d.useEffect(()=>{if(c!==void 0){const i=window.setTimeout(()=>n(!0),c);return()=>window.clearTimeout(i)}},[c]),l&&t.imageLoadingStatus!=="loaded"?a.jsx(L.span,{...o,ref:r}):null});Y.displayName=Q;function _(e,r){return e?r?(e.src!==r&&(e.src=r),e.complete&&e.naturalWidth>0?"loaded":"loading"):"error":"idle"}function va(e,{referrerPolicy:r,crossOrigin:s}){const c=da(),o=d.useRef(null),t=c?(o.current||(o.current=new window.Image),o.current):null,[l,n]=d.useState(()=>_(t,e));return F(()=>{n(_(t,e))},[t,e]),F(()=>{const i=g=>()=>{n(g)};if(!t)return;const v=i("loaded"),p=i("error");return t.addEventListener("load",v),t.addEventListener("error",p),r&&(t.referrerPolicy=r),typeof s=="string"&&(t.crossOrigin=s),()=>{t.removeEventListener("load",v),t.removeEventListener("error",p)}},[t,s,r]),l}var Z=q,aa=V,ea=Y;const u=d.forwardRef(({className:e,...r},s)=>a.jsx(Z,{ref:s,className:y("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",e),...r}));u.displayName=Z.displayName;const b=d.forwardRef(({className:e,...r},s)=>a.jsx(aa,{ref:s,className:y("aspect-square h-full w-full",e),...r}));b.displayName=aa.displayName;const m=d.forwardRef(({className:e,...r},s)=>a.jsx(ea,{ref:s,className:y("flex h-full w-full items-center justify-center rounded-full bg-muted",e),...r}));m.displayName=ea.displayName;u.__docgenInfo={description:"",methods:[]};b.__docgenInfo={description:"",methods:[]};m.__docgenInfo={description:"",methods:[]};const ka={title:"UI/Avatar",component:u,tags:["autodocs"]},f={render:()=>a.jsxs(u,{children:[a.jsx(b,{src:"https://github.com/shadcn.png",alt:"@shadcn"}),a.jsx(m,{children:"CN"})]})},N={render:()=>a.jsxs(u,{children:[a.jsx(b,{src:"",alt:"User"}),a.jsx(m,{children:"JD"})]})},j={render:()=>a.jsxs("div",{className:"flex items-center gap-4",children:[a.jsxs(u,{className:"h-6 w-6",children:[a.jsx(b,{src:"https://github.com/shadcn.png",alt:"Small"}),a.jsx(m,{className:"text-xs",children:"SM"})]}),a.jsxs(u,{children:[a.jsx(b,{src:"https://github.com/shadcn.png",alt:"Default"}),a.jsx(m,{children:"MD"})]}),a.jsxs(u,{className:"h-14 w-14",children:[a.jsx(b,{src:"https://github.com/shadcn.png",alt:"Large"}),a.jsx(m,{className:"text-lg",children:"LG"})]}),a.jsxs(u,{className:"h-20 w-20",children:[a.jsx(b,{src:"https://github.com/shadcn.png",alt:"Extra Large"}),a.jsx(m,{className:"text-xl",children:"XL"})]})]})},w={render:()=>a.jsxs("div",{className:"flex -space-x-4",children:[a.jsx(u,{className:"border-2 border-background",children:a.jsx(m,{className:"bg-blue-500 text-white",children:"JD"})}),a.jsx(u,{className:"border-2 border-background",children:a.jsx(m,{className:"bg-green-500 text-white",children:"AB"})}),a.jsx(u,{className:"border-2 border-background",children:a.jsx(m,{className:"bg-purple-500 text-white",children:"CD"})}),a.jsx(u,{className:"border-2 border-background",children:a.jsx(m,{className:"bg-gray-500 text-white",children:"+3"})})]})},k={render:()=>a.jsxs("div",{className:"flex items-center gap-6",children:[a.jsxs("div",{className:"relative",children:[a.jsx(u,{children:a.jsx(m,{className:"bg-blue-500 text-white",children:"ON"})}),a.jsx("span",{className:"absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500"})]}),a.jsxs("div",{className:"relative",children:[a.jsx(u,{children:a.jsx(m,{className:"bg-purple-500 text-white",children:"AW"})}),a.jsx("span",{className:"absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-yellow-500"})]}),a.jsxs("div",{className:"relative",children:[a.jsx(u,{children:a.jsx(m,{className:"bg-gray-500 text-white",children:"OF"})}),a.jsx("span",{className:"absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-gray-400"})]})]})};var E,R,M;f.parameters={...f.parameters,docs:{...(E=f.parameters)==null?void 0:E.docs,source:{originalSource:`{
  render: () => <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
}`,...(M=(R=f.parameters)==null?void 0:R.docs)==null?void 0:M.source}}};var P,D,$;N.parameters={...N.parameters,docs:{...(P=N.parameters)==null?void 0:P.docs,source:{originalSource:`{
  render: () => <Avatar>
      <AvatarImage src="" alt="User" />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
}`,...($=(D=N.parameters)==null?void 0:D.docs)==null?void 0:$.source}}};var W,O,G;j.parameters={...j.parameters,docs:{...(W=j.parameters)==null?void 0:W.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-4">
      <Avatar className="h-6 w-6">
        <AvatarImage src="https://github.com/shadcn.png" alt="Small" />
        <AvatarFallback className="text-xs">SM</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="Default" />
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
      <Avatar className="h-14 w-14">
        <AvatarImage src="https://github.com/shadcn.png" alt="Large" />
        <AvatarFallback className="text-lg">LG</AvatarFallback>
      </Avatar>
      <Avatar className="h-20 w-20">
        <AvatarImage src="https://github.com/shadcn.png" alt="Extra Large" />
        <AvatarFallback className="text-xl">XL</AvatarFallback>
      </Avatar>
    </div>
}`,...(G=(O=j.parameters)==null?void 0:O.docs)==null?void 0:G.source}}};var B,J,H;w.parameters={...w.parameters,docs:{...(B=w.parameters)==null?void 0:B.docs,source:{originalSource:`{
  render: () => <div className="flex -space-x-4">
      <Avatar className="border-2 border-background">
        <AvatarFallback className="bg-blue-500 text-white">JD</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback className="bg-green-500 text-white">AB</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback className="bg-purple-500 text-white">CD</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback className="bg-gray-500 text-white">+3</AvatarFallback>
      </Avatar>
    </div>
}`,...(H=(J=w.parameters)==null?void 0:J.docs)==null?void 0:H.source}}};var T,U,z;k.parameters={...k.parameters,docs:{...(T=k.parameters)==null?void 0:T.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-6">
      <div className="relative">
        <Avatar>
          <AvatarFallback className="bg-blue-500 text-white">ON</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
      </div>
      <div className="relative">
        <Avatar>
          <AvatarFallback className="bg-purple-500 text-white">AW</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-yellow-500" />
      </div>
      <div className="relative">
        <Avatar>
          <AvatarFallback className="bg-gray-500 text-white">OF</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-gray-400" />
      </div>
    </div>
}`,...(z=(U=k.parameters)==null?void 0:U.docs)==null?void 0:z.source}}};const Sa=["WithImage","WithFallback","Sizes","AvatarGroup","WithStatus"];export{w as AvatarGroup,j as Sizes,N as WithFallback,f as WithImage,k as WithStatus,Sa as __namedExportsOrder,ka as default};
