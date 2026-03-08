import{j as e}from"./jsx-runtime-Z5uAzocK.js";import{r as l}from"./index-pP6CS22B.js";import{u as ca}from"./index-DSMx10ar.js";import{u as E}from"./index-xdNYasdH.js";import"./index-Bvak3XBe.js";import{c as la}from"./index-cAPKYzjE.js";import{c as L}from"./utils-BLSKlp9E.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-x8NkB57A.js";function da(a,r=[]){let t=[];function c(s,d){const o=l.createContext(d);o.displayName=s+"Context";const i=t.length;t=[...t,d];const v=b=>{var _;const{scope:g,children:y,...f}=b,A=((_=g==null?void 0:g[a])==null?void 0:_[i])||o,oa=l.useMemo(()=>f,Object.values(f));return e.jsx(A.Provider,{value:oa,children:y})};v.displayName=s+"Provider";function x(b,g){var A;const y=((A=g==null?void 0:g[a])==null?void 0:A[i])||o,f=l.useContext(y);if(f)return f;if(d!==void 0)return d;throw new Error(`\`${b}\` must be used within \`${s}\``)}return[v,x]}const n=()=>{const s=t.map(d=>l.createContext(d));return function(o){const i=(o==null?void 0:o[a])||s;return l.useMemo(()=>({[`__scope${a}`]:{...o,[a]:i}}),[o,i])}};return n.scopeName=a,[c,ia(n,...r)]}function ia(...a){const r=a[0];if(a.length===1)return r;const t=()=>{const c=a.map(n=>({useScope:n(),scopeName:n.scopeName}));return function(s){const d=c.reduce((o,{useScope:i,scopeName:v})=>{const b=i(s)[`__scope${v}`];return{...o,...b}},{});return l.useMemo(()=>({[`__scope${r.scopeName}`]:d}),[d])}};return t.scopeName=r.scopeName,t}var ua=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"],I=ua.reduce((a,r)=>{const t=la(`Primitive.${r}`),c=l.forwardRef((n,s)=>{const{asChild:d,...o}=n,i=d?t:r;return typeof window<"u"&&(window[Symbol.for("radix-ui")]=!0),e.jsx(i,{...o,ref:s})});return c.displayName=`Primitive.${r}`,{...a,[r]:c}},{}),q={exports:{}},K={};/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var p=l;function ma(a,r){return a===r&&(a!==0||1/a===1/r)||a!==a&&r!==r}var va=typeof Object.is=="function"?Object.is:ma,ha=p.useState,ba=p.useEffect,ga=p.useLayoutEffect,pa=p.useDebugValue;function xa(a,r){var t=r(),c=ha({inst:{value:t,getSnapshot:r}}),n=c[0].inst,s=c[1];return ga(function(){n.value=t,n.getSnapshot=r,F(n)&&s({inst:n})},[a,t,r]),ba(function(){return F(n)&&s({inst:n}),a(function(){F(n)&&s({inst:n})})},[a]),pa(t),t}function F(a){var r=a.getSnapshot;a=a.value;try{var t=r();return!va(a,t)}catch{return!0}}function fa(a,r){return r()}var Aa=typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"?fa:xa;K.useSyncExternalStore=p.useSyncExternalStore!==void 0?p.useSyncExternalStore:Aa;q.exports=K;var Na=q.exports;function Sa(){return Na.useSyncExternalStore(wa,()=>!0,()=>!1)}function wa(){return()=>{}}var C="Avatar",[ja]=da(C),[ka,Q]=ja(C),Y=l.forwardRef((a,r)=>{const{__scopeAvatar:t,...c}=a,[n,s]=l.useState("idle");return e.jsx(ka,{scope:t,imageLoadingStatus:n,onImageLoadingStatusChange:s,children:e.jsx(I.span,{...c,ref:r})})});Y.displayName=C;var Z="AvatarImage",aa=l.forwardRef((a,r)=>{const{__scopeAvatar:t,src:c,onLoadingStatusChange:n=()=>{},...s}=a,d=Q(Z,t),o=ya(c,s),i=ca(v=>{n(v),d.onImageLoadingStatusChange(v)});return E(()=>{o!=="idle"&&i(o)},[o,i]),o==="loaded"?e.jsx(I.img,{...s,ref:r,src:c}):null});aa.displayName=Z;var ea="AvatarFallback",ra=l.forwardRef((a,r)=>{const{__scopeAvatar:t,delayMs:c,...n}=a,s=Q(ea,t),[d,o]=l.useState(c===void 0);return l.useEffect(()=>{if(c!==void 0){const i=window.setTimeout(()=>o(!0),c);return()=>window.clearTimeout(i)}},[c]),d&&s.imageLoadingStatus!=="loaded"?e.jsx(I.span,{...n,ref:r}):null});ra.displayName=ea;function R(a,r){return a?r?(a.src!==r&&(a.src=r),a.complete&&a.naturalWidth>0?"loaded":"loading"):"error":"idle"}function ya(a,{referrerPolicy:r,crossOrigin:t}){const c=Sa(),n=l.useRef(null),s=c?(n.current||(n.current=new window.Image),n.current):null,[d,o]=l.useState(()=>R(s,a));return E(()=>{o(R(s,a))},[s,a]),E(()=>{const i=b=>()=>{o(b)};if(!s)return;const v=i("loaded"),x=i("error");return s.addEventListener("load",v),s.addEventListener("error",x),r&&(s.referrerPolicy=r),typeof t=="string"&&(s.crossOrigin=t),()=>{s.removeEventListener("load",v),s.removeEventListener("error",x)}},[s,t,r]),d}var ta=Y,sa=aa,na=ra;const u=l.forwardRef(({className:a,...r},t)=>e.jsx(ta,{ref:t,className:L("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",a),...r}));u.displayName=ta.displayName;const h=l.forwardRef(({className:a,...r},t)=>e.jsx(sa,{ref:t,className:L("aspect-square h-full w-full",a),...r}));h.displayName=sa.displayName;const m=l.forwardRef(({className:a,...r},t)=>e.jsx(na,{ref:t,className:L("flex h-full w-full items-center justify-center rounded-full bg-muted",a),...r}));m.displayName=na.displayName;u.__docgenInfo={description:"",methods:[]};h.__docgenInfo={description:"",methods:[]};m.__docgenInfo={description:"",methods:[]};const Ma={title:"UI/Avatar",component:u,tags:["autodocs"]},N={render:()=>e.jsxs(u,{children:[e.jsx(h,{src:"https://github.com/shadcn.png",alt:"@shadcn"}),e.jsx(m,{children:"CN"})]})},S={render:()=>e.jsxs(u,{children:[e.jsx(h,{src:"",alt:"User"}),e.jsx(m,{children:"JD"})]})},w={render:()=>e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs(u,{className:"h-6 w-6",children:[e.jsx(h,{src:"https://github.com/shadcn.png",alt:"Small"}),e.jsx(m,{className:"text-xs",children:"SM"})]}),e.jsxs(u,{children:[e.jsx(h,{src:"https://github.com/shadcn.png",alt:"Default"}),e.jsx(m,{children:"MD"})]}),e.jsxs(u,{className:"h-14 w-14",children:[e.jsx(h,{src:"https://github.com/shadcn.png",alt:"Large"}),e.jsx(m,{className:"text-lg",children:"LG"})]}),e.jsxs(u,{className:"h-20 w-20",children:[e.jsx(h,{src:"https://github.com/shadcn.png",alt:"Extra Large"}),e.jsx(m,{className:"text-xl",children:"XL"})]})]})},j={render:()=>e.jsxs("div",{className:"flex -space-x-4",children:[e.jsx(u,{className:"border-2 border-background",children:e.jsx(m,{className:"bg-blue-500 text-white",children:"JD"})}),e.jsx(u,{className:"border-2 border-background",children:e.jsx(m,{className:"bg-green-500 text-white",children:"AB"})}),e.jsx(u,{className:"border-2 border-background",children:e.jsx(m,{className:"bg-purple-500 text-white",children:"CD"})}),e.jsx(u,{className:"border-2 border-background",children:e.jsx(m,{className:"bg-gray-500 text-white",children:"+3"})})]})},k={render:()=>e.jsxs("div",{className:"flex items-center gap-6",children:[e.jsxs("div",{className:"relative",children:[e.jsx(u,{children:e.jsx(m,{className:"bg-blue-500 text-white",children:"ON"})}),e.jsx("span",{className:"absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500"})]}),e.jsxs("div",{className:"relative",children:[e.jsx(u,{children:e.jsx(m,{className:"bg-purple-500 text-white",children:"AW"})}),e.jsx("span",{className:"absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-yellow-500"})]}),e.jsxs("div",{className:"relative",children:[e.jsx(u,{children:e.jsx(m,{className:"bg-gray-500 text-white",children:"OF"})}),e.jsx("span",{className:"absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-gray-400"})]})]})};var D,$,M;N.parameters={...N.parameters,docs:{...(D=N.parameters)==null?void 0:D.docs,source:{originalSource:`{
  render: () => <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
}`,...(M=($=N.parameters)==null?void 0:$.docs)==null?void 0:M.source}}};var P,W,O;S.parameters={...S.parameters,docs:{...(P=S.parameters)==null?void 0:P.docs,source:{originalSource:`{
  render: () => <Avatar>
      <AvatarImage src="" alt="User" />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
}`,...(O=(W=S.parameters)==null?void 0:W.docs)==null?void 0:O.source}}};var G,B,J;w.parameters={...w.parameters,docs:{...(G=w.parameters)==null?void 0:G.docs,source:{originalSource:`{
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
}`,...(J=(B=w.parameters)==null?void 0:B.docs)==null?void 0:J.source}}};var U,H,T;j.parameters={...j.parameters,docs:{...(U=j.parameters)==null?void 0:U.docs,source:{originalSource:`{
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
}`,...(T=(H=j.parameters)==null?void 0:H.docs)==null?void 0:T.source}}};var V,z,X;k.parameters={...k.parameters,docs:{...(V=k.parameters)==null?void 0:V.docs,source:{originalSource:`{
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
}`,...(X=(z=k.parameters)==null?void 0:z.docs)==null?void 0:X.source}}};const Pa=["WithImage","WithFallback","Sizes","AvatarGroup","WithStatus"];export{j as AvatarGroup,w as Sizes,S as WithFallback,N as WithImage,k as WithStatus,Pa as __namedExportsOrder,Ma as default};
