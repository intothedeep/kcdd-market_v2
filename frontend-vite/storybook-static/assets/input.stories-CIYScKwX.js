import{j as e}from"./jsx-runtime-Z5uAzocK.js";import{I as a}from"./input-DRLCrBPJ.js";import{L as d}from"./label-BhlulYsX.js";import"./index-pP6CS22B.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./utils-BLSKlp9E.js";import"./index-Bvak3XBe.js";import"./index-cAPKYzjE.js";import"./index-x8NkB57A.js";import"./index-1evVQkiP.js";const G={title:"UI/Input",component:a,tags:["autodocs"],argTypes:{type:{control:"select",options:["text","email","password","number","search","tel","url"]},disabled:{control:"boolean"}}},r={args:{placeholder:"Enter text..."}},s={args:{type:"email",placeholder:"email@example.com"}},l={args:{type:"password",placeholder:"Enter password..."}},o={args:{placeholder:"Disabled input",disabled:!0}},m={args:{defaultValue:"Pre-filled value"}},t={render:()=>e.jsxs("div",{className:"grid w-full max-w-sm gap-1.5",children:[e.jsx(d,{htmlFor:"email",children:"Email"}),e.jsx(a,{type:"email",id:"email",placeholder:"Email"})]})},c={render:()=>e.jsxs("div",{className:"flex w-full max-w-sm flex-col gap-4",children:[e.jsxs("div",{className:"grid gap-1.5",children:[e.jsx(d,{htmlFor:"firstName",children:"First Name"}),e.jsx(a,{id:"firstName",placeholder:"John"})]}),e.jsxs("div",{className:"grid gap-1.5",children:[e.jsx(d,{htmlFor:"lastName",children:"Last Name"}),e.jsx(a,{id:"lastName",placeholder:"Doe"})]}),e.jsxs("div",{className:"grid gap-1.5",children:[e.jsx(d,{htmlFor:"email",children:"Email"}),e.jsx(a,{type:"email",id:"email",placeholder:"john.doe@example.com"})]})]})},i={args:{type:"search",placeholder:"Search...",className:"pl-8"}};var p,n,u;r.parameters={...r.parameters,docs:{...(p=r.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter text...'
  }
}`,...(u=(n=r.parameters)==null?void 0:n.docs)==null?void 0:u.source}}};var h,g,x;s.parameters={...s.parameters,docs:{...(h=s.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    type: 'email',
    placeholder: 'email@example.com'
  }
}`,...(x=(g=s.parameters)==null?void 0:g.docs)==null?void 0:x.source}}};var N,f,b;l.parameters={...l.parameters,docs:{...(N=l.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    type: 'password',
    placeholder: 'Enter password...'
  }
}`,...(b=(f=l.parameters)==null?void 0:f.docs)==null?void 0:b.source}}};var j,v,E;o.parameters={...o.parameters,docs:{...(j=o.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    placeholder: 'Disabled input',
    disabled: true
  }
}`,...(E=(v=o.parameters)==null?void 0:v.docs)==null?void 0:E.source}}};var w,L,y;m.parameters={...m.parameters,docs:{...(w=m.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    defaultValue: 'Pre-filled value'
  }
}`,...(y=(L=m.parameters)==null?void 0:L.docs)==null?void 0:y.source}}};var F,S,D;t.parameters={...t.parameters,docs:{...(F=t.parameters)==null?void 0:F.docs,source:{originalSource:`{
  render: () => <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
}`,...(D=(S=t.parameters)==null?void 0:S.docs)==null?void 0:D.source}}};var I,P,V;c.parameters={...c.parameters,docs:{...(I=c.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: () => <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="firstName">First Name</Label>
        <Input id="firstName" placeholder="John" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="lastName">Last Name</Label>
        <Input id="lastName" placeholder="Doe" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input type="email" id="email" placeholder="john.doe@example.com" />
      </div>
    </div>
}`,...(V=(P=c.parameters)==null?void 0:P.docs)==null?void 0:V.source}}};var W,J,_;i.parameters={...i.parameters,docs:{...(W=i.parameters)==null?void 0:W.docs,source:{originalSource:`{
  args: {
    type: 'search',
    placeholder: 'Search...',
    className: 'pl-8'
  }
}`,...(_=(J=i.parameters)==null?void 0:J.docs)==null?void 0:_.source}}};const H=["Default","Email","Password","Disabled","WithValue","WithLabel","FormExample","Search"];export{r as Default,o as Disabled,s as Email,c as FormExample,l as Password,i as Search,t as WithLabel,m as WithValue,H as __namedExportsOrder,G as default};
