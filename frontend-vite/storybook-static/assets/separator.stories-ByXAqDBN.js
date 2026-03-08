import{j as e}from"./jsx-runtime-Z5uAzocK.js";import{S as r}from"./separator-DlaycN7c.js";import"./index-pP6CS22B.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-Bvak3XBe.js";import"./index-cAPKYzjE.js";import"./index-x8NkB57A.js";import"./utils-BLSKlp9E.js";const z={title:"UI/Separator",component:r,tags:["autodocs"],argTypes:{orientation:{control:"select",options:["horizontal","vertical"]}}},s={render:()=>e.jsxs("div",{className:"w-full max-w-md",children:[e.jsxs("div",{className:"space-y-1",children:[e.jsx("h4",{className:"text-sm font-medium leading-none",children:"Section Title"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Some description text here."})]}),e.jsx(r,{className:"my-4"}),e.jsxs("div",{className:"space-y-1",children:[e.jsx("h4",{className:"text-sm font-medium leading-none",children:"Another Section"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"More content below the separator."})]})]})},t={render:()=>e.jsxs("div",{className:"flex h-5 items-center space-x-4 text-sm",children:[e.jsx("div",{children:"Blog"}),e.jsx(r,{orientation:"vertical"}),e.jsx("div",{children:"Docs"}),e.jsx(r,{orientation:"vertical"}),e.jsx("div",{children:"Source"})]})},a={render:()=>e.jsxs("div",{className:"flex h-5 items-center space-x-4 text-sm",children:[e.jsx("span",{className:"cursor-pointer font-medium",children:"Home"}),e.jsx(r,{orientation:"vertical"}),e.jsx("span",{className:"cursor-pointer text-muted-foreground hover:text-foreground",children:"Products"}),e.jsx(r,{orientation:"vertical"}),e.jsx("span",{className:"cursor-pointer text-muted-foreground hover:text-foreground",children:"About"}),e.jsx(r,{orientation:"vertical"}),e.jsx("span",{className:"cursor-pointer text-muted-foreground hover:text-foreground",children:"Contact"})]})},o={render:()=>e.jsxs("div",{className:"w-full max-w-sm",children:[e.jsxs("div",{className:"py-3",children:[e.jsx("div",{className:"font-medium",children:"Item 1"}),e.jsx("div",{className:"text-sm text-muted-foreground",children:"Description for item 1"})]}),e.jsx(r,{}),e.jsxs("div",{className:"py-3",children:[e.jsx("div",{className:"font-medium",children:"Item 2"}),e.jsx("div",{className:"text-sm text-muted-foreground",children:"Description for item 2"})]}),e.jsx(r,{}),e.jsxs("div",{className:"py-3",children:[e.jsx("div",{className:"font-medium",children:"Item 3"}),e.jsx("div",{className:"text-sm text-muted-foreground",children:"Description for item 3"})]})]})},n={render:()=>e.jsxs("div",{className:"w-full max-w-md space-y-4",children:[e.jsx(r,{}),e.jsx(r,{className:"bg-primary"}),e.jsx(r,{className:"bg-destructive"}),e.jsx(r,{className:"bg-muted-foreground"})]})};var i,m,c;s.parameters={...s.parameters,docs:{...(i=s.parameters)==null?void 0:i.docs,source:{originalSource:`{
  render: () => <div className="w-full max-w-md">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Section Title</h4>
        <p className="text-sm text-muted-foreground">Some description text here.</p>
      </div>
      <Separator className="my-4" />
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Another Section</h4>
        <p className="text-sm text-muted-foreground">More content below the separator.</p>
      </div>
    </div>
}`,...(c=(m=s.parameters)==null?void 0:m.docs)==null?void 0:c.source}}};var d,l,p;t.parameters={...t.parameters,docs:{...(d=t.parameters)==null?void 0:d.docs,source:{originalSource:`{
  render: () => <div className="flex h-5 items-center space-x-4 text-sm">
      <div>Blog</div>
      <Separator orientation="vertical" />
      <div>Docs</div>
      <Separator orientation="vertical" />
      <div>Source</div>
    </div>
}`,...(p=(l=t.parameters)==null?void 0:l.docs)==null?void 0:p.source}}};var x,u,v;a.parameters={...a.parameters,docs:{...(x=a.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => <div className="flex h-5 items-center space-x-4 text-sm">
      <span className="cursor-pointer font-medium">Home</span>
      <Separator orientation="vertical" />
      <span className="cursor-pointer text-muted-foreground hover:text-foreground">Products</span>
      <Separator orientation="vertical" />
      <span className="cursor-pointer text-muted-foreground hover:text-foreground">About</span>
      <Separator orientation="vertical" />
      <span className="cursor-pointer text-muted-foreground hover:text-foreground">Contact</span>
    </div>
}`,...(v=(u=a.parameters)==null?void 0:u.docs)==null?void 0:v.source}}};var f,N,h;o.parameters={...o.parameters,docs:{...(f=o.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => <div className="w-full max-w-sm">
      <div className="py-3">
        <div className="font-medium">Item 1</div>
        <div className="text-sm text-muted-foreground">Description for item 1</div>
      </div>
      <Separator />
      <div className="py-3">
        <div className="font-medium">Item 2</div>
        <div className="text-sm text-muted-foreground">Description for item 2</div>
      </div>
      <Separator />
      <div className="py-3">
        <div className="font-medium">Item 3</div>
        <div className="text-sm text-muted-foreground">Description for item 3</div>
      </div>
    </div>
}`,...(h=(N=o.parameters)==null?void 0:N.docs)==null?void 0:h.source}}};var g,j,S;n.parameters={...n.parameters,docs:{...(g=n.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => <div className="w-full max-w-md space-y-4">
      <Separator />
      <Separator className="bg-primary" />
      <Separator className="bg-destructive" />
      <Separator className="bg-muted-foreground" />
    </div>
}`,...(S=(j=n.parameters)==null?void 0:j.docs)==null?void 0:S.source}}};const T=["Horizontal","Vertical","InNavigation","InList","WithDifferentColors"];export{s as Horizontal,o as InList,a as InNavigation,t as Vertical,n as WithDifferentColors,T as __namedExportsOrder,z as default};
