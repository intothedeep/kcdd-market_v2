import{j as e}from"./jsx-runtime-Z5uAzocK.js";import{r}from"./index-pP6CS22B.js";import{P as Z,c as de,a as le}from"./index-BYUIXDsI.js";import{u as ee}from"./index-x8NkB57A.js";import{u as me}from"./index-Ck0Qw0kh.js";import{u as ue}from"./index-WyfESzTi.js";import{u as pe}from"./index-n-b12q8t.js";import{c as R}from"./utils-BLSKlp9E.js";import{L as n}from"./label-BhlulYsX.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-Bvak3XBe.js";import"./index-xdNYasdH.js";import"./index-cAPKYzjE.js";import"./index-1evVQkiP.js";var k="Switch",[fe]=le(k),[he,be]=fe(k),te=r.forwardRef((a,i)=>{const{__scopeSwitch:t,name:o,checked:c,defaultChecked:S,required:m,disabled:d,value:u="on",onCheckedChange:C,form:l,...L}=a,[p,f]=r.useState(null),P=ee(i,b=>f(b)),E=r.useRef(!1),F=p?l||!!p.closest("form"):!0,[h,ne]=me({prop:c,defaultProp:S??!1,onChange:C,caller:k});return e.jsxs(he,{scope:t,checked:h,disabled:d,children:[e.jsx(Z.button,{type:"button",role:"switch","aria-checked":h,"aria-required":m,"data-state":ie(h),"data-disabled":d?"":void 0,disabled:d,value:u,...L,ref:P,onClick:de(a.onClick,b=>{ne(oe=>!oe),F&&(E.current=b.isPropagationStopped(),E.current||b.stopPropagation())})}),F&&e.jsx(re,{control:p,bubbles:!E.current,name:o,value:u,checked:h,required:m,disabled:d,form:l,style:{transform:"translateX(-100%)"}})]})});te.displayName=k;var se="SwitchThumb",ae=r.forwardRef((a,i)=>{const{__scopeSwitch:t,...o}=a,c=be(se,t);return e.jsx(Z.span,{"data-state":ie(c.checked),"data-disabled":c.disabled?"":void 0,...o,ref:i})});ae.displayName=se;var xe="SwitchBubbleInput",re=r.forwardRef(({__scopeSwitch:a,control:i,checked:t,bubbles:o=!0,...c},S)=>{const m=r.useRef(null),d=ee(m,S),u=ue(t),C=pe(i);return r.useEffect(()=>{const l=m.current;if(!l)return;const L=window.HTMLInputElement.prototype,f=Object.getOwnPropertyDescriptor(L,"checked").set;if(u!==t&&f){const P=new Event("click",{bubbles:o});f.call(l,t),l.dispatchEvent(P)}},[u,t,o]),e.jsx("input",{type:"checkbox","aria-hidden":!0,defaultChecked:t,...c,tabIndex:-1,ref:d,style:{...c.style,...C,position:"absolute",pointerEvents:"none",opacity:0,margin:0}})});re.displayName=xe;function ie(a){return a?"checked":"unchecked"}var ce=te,ve=ae;const s=r.forwardRef(({className:a,...i},t)=>e.jsx(ce,{className:R("peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",a),...i,ref:t,children:e.jsx(ve,{className:R("pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0")})}));s.displayName=ce.displayName;s.__docgenInfo={description:"",methods:[]};const Me={title:"UI/Switch",component:s,tags:["autodocs"],argTypes:{disabled:{control:"boolean"},checked:{control:"boolean"}}},x={args:{}},v={args:{defaultChecked:!0}},w={args:{disabled:!0}},g={args:{disabled:!0,defaultChecked:!0}},y={render:()=>e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(s,{id:"airplane-mode"}),e.jsx(n,{htmlFor:"airplane-mode",children:"Airplane Mode"})]})},j={render:()=>e.jsxs("div",{className:"w-full max-w-md space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"space-y-0.5",children:[e.jsx(n,{htmlFor:"notifications",children:"Notifications"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Receive notifications about updates."})]}),e.jsx(s,{id:"notifications",defaultChecked:!0})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"space-y-0.5",children:[e.jsx(n,{htmlFor:"marketing",children:"Marketing emails"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Receive emails about new features."})]}),e.jsx(s,{id:"marketing"})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"space-y-0.5",children:[e.jsx(n,{htmlFor:"security",children:"Security alerts"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Get notified about security issues."})]}),e.jsx(s,{id:"security",defaultChecked:!0})]})]})},N={render:()=>e.jsxs("div",{className:"w-full max-w-md space-y-4 rounded-lg border p-4",children:[e.jsx("h3",{className:"font-medium",children:"Privacy Settings"}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx(n,{htmlFor:"profile-public",children:"Public profile"}),e.jsx(s,{id:"profile-public",defaultChecked:!0})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx(n,{htmlFor:"show-email",children:"Show email"}),e.jsx(s,{id:"show-email"})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx(n,{htmlFor:"activity-status",children:"Activity status"}),e.jsx(s,{id:"activity-status",defaultChecked:!0})]})]})]})};var _,M,I;x.parameters={...x.parameters,docs:{...(_=x.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {}
}`,...(I=(M=x.parameters)==null?void 0:M.docs)==null?void 0:I.source}}};var T,A,B;v.parameters={...v.parameters,docs:{...(T=v.parameters)==null?void 0:T.docs,source:{originalSource:`{
  args: {
    defaultChecked: true
  }
}`,...(B=(A=v.parameters)==null?void 0:A.docs)==null?void 0:B.source}}};var D,H,U;w.parameters={...w.parameters,docs:{...(D=w.parameters)==null?void 0:D.docs,source:{originalSource:`{
  args: {
    disabled: true
  }
}`,...(U=(H=w.parameters)==null?void 0:H.docs)==null?void 0:U.source}}};var O,W,q;g.parameters={...g.parameters,docs:{...(O=g.parameters)==null?void 0:O.docs,source:{originalSource:`{
  args: {
    disabled: true,
    defaultChecked: true
  }
}`,...(q=(W=g.parameters)==null?void 0:W.docs)==null?void 0:q.source}}};var z,G,X;y.parameters={...y.parameters,docs:{...(z=y.parameters)==null?void 0:z.docs,source:{originalSource:`{
  render: () => <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
}`,...(X=(G=y.parameters)==null?void 0:G.docs)==null?void 0:X.source}}};var $,J,K;j.parameters={...j.parameters,docs:{...($=j.parameters)==null?void 0:$.docs,source:{originalSource:`{
  render: () => <div className="w-full max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="notifications">Notifications</Label>
          <p className="text-sm text-muted-foreground">Receive notifications about updates.</p>
        </div>
        <Switch id="notifications" defaultChecked />
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="marketing">Marketing emails</Label>
          <p className="text-sm text-muted-foreground">Receive emails about new features.</p>
        </div>
        <Switch id="marketing" />
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="security">Security alerts</Label>
          <p className="text-sm text-muted-foreground">Get notified about security issues.</p>
        </div>
        <Switch id="security" defaultChecked />
      </div>
    </div>
}`,...(K=(J=j.parameters)==null?void 0:J.docs)==null?void 0:K.source}}};var Q,V,Y;N.parameters={...N.parameters,docs:{...(Q=N.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  render: () => <div className="w-full max-w-md space-y-4 rounded-lg border p-4">
      <h3 className="font-medium">Privacy Settings</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="profile-public">Public profile</Label>
          <Switch id="profile-public" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="show-email">Show email</Label>
          <Switch id="show-email" />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="activity-status">Activity status</Label>
          <Switch id="activity-status" defaultChecked />
        </div>
      </div>
    </div>
}`,...(Y=(V=N.parameters)==null?void 0:V.docs)==null?void 0:Y.source}}};const Ie=["Default","Checked","Disabled","DisabledChecked","WithLabel","SettingsExample","FormExample"];export{v as Checked,x as Default,w as Disabled,g as DisabledChecked,N as FormExample,j as SettingsExample,y as WithLabel,Ie as __namedExportsOrder,Me as default};
