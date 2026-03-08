import{j as e}from"./jsx-runtime-Z5uAzocK.js";import{L as a}from"./label-BhlulYsX.js";import{I as r}from"./input-DRLCrBPJ.js";import{C as I}from"./checkbox-DOU5bZGI.js";import"./index-pP6CS22B.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-Bvak3XBe.js";import"./index-cAPKYzjE.js";import"./index-x8NkB57A.js";import"./index-1evVQkiP.js";import"./utils-BLSKlp9E.js";import"./index-BYUIXDsI.js";import"./index-Ck0Qw0kh.js";import"./index-xdNYasdH.js";import"./index-WyfESzTi.js";import"./index-n-b12q8t.js";import"./index-CbcPFHB_.js";import"./check-BA-96TH2.js";import"./createLucideIcon-DNXvdQsS.js";const Q={title:"UI/Label",component:a,tags:["autodocs"]},s={render:()=>e.jsx(a,{children:"Email address"})},l={render:()=>e.jsxs("div",{className:"grid w-full max-w-sm gap-1.5",children:[e.jsx(a,{htmlFor:"email",children:"Email"}),e.jsx(r,{type:"email",id:"email",placeholder:"Email"})]})},i={render:()=>e.jsxs("div",{className:"grid w-full max-w-sm gap-1.5",children:[e.jsxs(a,{htmlFor:"required-email",children:["Email ",e.jsx("span",{className:"text-destructive",children:"*"})]}),e.jsx(r,{type:"email",id:"required-email",placeholder:"Required field"})]})},m={render:()=>e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(I,{id:"terms"}),e.jsx(a,{htmlFor:"terms",children:"Accept terms and conditions"})]})},d={render:()=>e.jsxs("div",{className:"grid w-full max-w-sm gap-1.5",children:[e.jsx(a,{htmlFor:"disabled-input",className:"opacity-70",children:"Disabled Field"}),e.jsx(r,{id:"disabled-input",disabled:!0,placeholder:"Cannot edit"})]})},t={render:()=>e.jsxs("div",{className:"w-full max-w-sm space-y-4",children:[e.jsxs("div",{className:"grid gap-1.5",children:[e.jsx(a,{htmlFor:"first-name",children:"First Name"}),e.jsx(r,{id:"first-name",placeholder:"John"})]}),e.jsxs("div",{className:"grid gap-1.5",children:[e.jsx(a,{htmlFor:"last-name",children:"Last Name"}),e.jsx(r,{id:"last-name",placeholder:"Doe"})]}),e.jsxs("div",{className:"grid gap-1.5",children:[e.jsxs(a,{htmlFor:"form-email",children:["Email ",e.jsx("span",{className:"text-destructive",children:"*"})]}),e.jsx(r,{type:"email",id:"form-email",placeholder:"john@example.com"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"We'll never share your email."})]})]})};var n,o,c;s.parameters={...s.parameters,docs:{...(n=s.parameters)==null?void 0:n.docs,source:{originalSource:`{
  render: () => <Label>Email address</Label>
}`,...(c=(o=s.parameters)==null?void 0:o.docs)==null?void 0:c.source}}};var p,u,h;l.parameters={...l.parameters,docs:{...(p=l.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
}`,...(h=(u=l.parameters)==null?void 0:u.docs)==null?void 0:h.source}}};var x,b,g;i.parameters={...i.parameters,docs:{...(x=i.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="required-email">
        Email <span className="text-destructive">*</span>
      </Label>
      <Input type="email" id="required-email" placeholder="Required field" />
    </div>
}`,...(g=(b=i.parameters)==null?void 0:b.docs)==null?void 0:g.source}}};var j,v,f;m.parameters={...m.parameters,docs:{...(j=m.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
}`,...(f=(v=m.parameters)==null?void 0:v.docs)==null?void 0:f.source}}};var N,L,F;d.parameters={...d.parameters,docs:{...(N=d.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: () => <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="disabled-input" className="opacity-70">
        Disabled Field
      </Label>
      <Input id="disabled-input" disabled placeholder="Cannot edit" />
    </div>
}`,...(F=(L=d.parameters)==null?void 0:L.docs)==null?void 0:F.source}}};var w,y,E;t.parameters={...t.parameters,docs:{...(w=t.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => <div className="w-full max-w-sm space-y-4">
      <div className="grid gap-1.5">
        <Label htmlFor="first-name">First Name</Label>
        <Input id="first-name" placeholder="John" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="last-name">Last Name</Label>
        <Input id="last-name" placeholder="Doe" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="form-email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input type="email" id="form-email" placeholder="john@example.com" />
        <p className="text-sm text-muted-foreground">We&apos;ll never share your email.</p>
      </div>
    </div>
}`,...(E=(y=t.parameters)==null?void 0:y.docs)==null?void 0:E.source}}};const T=["Default","WithInput","Required","WithCheckbox","Disabled","FormLabels"];export{s as Default,d as Disabled,t as FormLabels,i as Required,m as WithCheckbox,l as WithInput,T as __namedExportsOrder,Q as default};
