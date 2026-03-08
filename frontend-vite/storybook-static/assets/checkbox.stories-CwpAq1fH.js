import{j as e}from"./jsx-runtime-Z5uAzocK.js";import{C as s}from"./checkbox-DOU5bZGI.js";import{L as a}from"./label-BhlulYsX.js";import"./index-pP6CS22B.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-x8NkB57A.js";import"./index-BYUIXDsI.js";import"./index-Bvak3XBe.js";import"./index-Ck0Qw0kh.js";import"./index-xdNYasdH.js";import"./index-WyfESzTi.js";import"./index-n-b12q8t.js";import"./index-CbcPFHB_.js";import"./utils-BLSKlp9E.js";import"./check-BA-96TH2.js";import"./createLucideIcon-DNXvdQsS.js";import"./index-cAPKYzjE.js";import"./index-1evVQkiP.js";const V={title:"UI/Checkbox",component:s,tags:["autodocs"],argTypes:{disabled:{control:"boolean"},checked:{control:"boolean"}}},r={args:{}},t={args:{defaultChecked:!0}},c={args:{disabled:!0}},i={args:{disabled:!0,defaultChecked:!0}},m={render:()=>e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(s,{id:"terms"}),e.jsx(a,{htmlFor:"terms",children:"Accept terms and conditions"})]})},o={render:()=>e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(s,{id:"email",defaultChecked:!0}),e.jsx(a,{htmlFor:"email",children:"Email notifications"})]}),e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(s,{id:"sms"}),e.jsx(a,{htmlFor:"sms",children:"SMS notifications"})]}),e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(s,{id:"push",defaultChecked:!0}),e.jsx(a,{htmlFor:"push",children:"Push notifications"})]})]})},n={render:()=>e.jsxs("div",{className:"space-y-4",children:[e.jsx("div",{className:"text-sm font-medium",children:"Notification Preferences"}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-start space-x-2",children:[e.jsx(s,{id:"marketing",className:"mt-1"}),e.jsxs("div",{children:[e.jsx(a,{htmlFor:"marketing",className:"text-sm font-medium",children:"Marketing emails"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Receive emails about new products, features, and more."})]})]}),e.jsxs("div",{className:"flex items-start space-x-2",children:[e.jsx(s,{id:"security",defaultChecked:!0,className:"mt-1"}),e.jsxs("div",{children:[e.jsx(a,{htmlFor:"security",className:"text-sm font-medium",children:"Security emails"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Receive emails about your account security."})]})]})]})]})};var d,l,u;r.parameters={...r.parameters,docs:{...(d=r.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {}
}`,...(u=(l=r.parameters)==null?void 0:l.docs)==null?void 0:u.source}}};var p,x,h;t.parameters={...t.parameters,docs:{...(p=t.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    defaultChecked: true
  }
}`,...(h=(x=t.parameters)==null?void 0:x.docs)==null?void 0:h.source}}};var f,b,v;c.parameters={...c.parameters,docs:{...(f=c.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    disabled: true
  }
}`,...(v=(b=c.parameters)==null?void 0:b.docs)==null?void 0:v.source}}};var N,k,j;i.parameters={...i.parameters,docs:{...(N=i.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    disabled: true,
    defaultChecked: true
  }
}`,...(j=(k=i.parameters)==null?void 0:k.docs)==null?void 0:j.source}}};var g,C,y;m.parameters={...m.parameters,docs:{...(g=m.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
}`,...(y=(C=m.parameters)==null?void 0:C.docs)==null?void 0:y.source}}};var L,F,S;o.parameters={...o.parameters,docs:{...(L=o.parameters)==null?void 0:L.docs,source:{originalSource:`{
  render: () => <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="email" defaultChecked />
        <Label htmlFor="email">Email notifications</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="sms" />
        <Label htmlFor="sms">SMS notifications</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="push" defaultChecked />
        <Label htmlFor="push">Push notifications</Label>
      </div>
    </div>
}`,...(S=(F=o.parameters)==null?void 0:F.docs)==null?void 0:S.source}}};var D,E,R;n.parameters={...n.parameters,docs:{...(D=n.parameters)==null?void 0:D.docs,source:{originalSource:`{
  render: () => <div className="space-y-4">
      <div className="text-sm font-medium">Notification Preferences</div>
      <div className="space-y-3">
        <div className="flex items-start space-x-2">
          <Checkbox id="marketing" className="mt-1" />
          <div>
            <Label htmlFor="marketing" className="text-sm font-medium">
              Marketing emails
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive emails about new products, features, and more.
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <Checkbox id="security" defaultChecked className="mt-1" />
          <div>
            <Label htmlFor="security" className="text-sm font-medium">
              Security emails
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive emails about your account security.
            </p>
          </div>
        </div>
      </div>
    </div>
}`,...(R=(E=n.parameters)==null?void 0:E.docs)==null?void 0:R.source}}};const X=["Default","Checked","Disabled","DisabledChecked","WithLabel","CheckboxGroup","FormExample"];export{o as CheckboxGroup,t as Checked,r as Default,c as Disabled,i as DisabledChecked,n as FormExample,m as WithLabel,X as __namedExportsOrder,V as default};
