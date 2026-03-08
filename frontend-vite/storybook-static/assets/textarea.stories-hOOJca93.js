import{j as e}from"./jsx-runtime-Z5uAzocK.js";import{r as I}from"./index-pP6CS22B.js";import{c as M}from"./utils-BLSKlp9E.js";import{L as r}from"./label-BhlulYsX.js";import{B as m}from"./button-Cophts_w.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-Bvak3XBe.js";import"./index-cAPKYzjE.js";import"./index-x8NkB57A.js";import"./index-1evVQkiP.js";const a=I.forwardRef(({className:_,...z},A)=>e.jsx("textarea",{className:M("flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",_),ref:A,...z}));a.displayName="Textarea";a.__docgenInfo={description:"",methods:[],displayName:"Textarea"};const X={title:"UI/Textarea",component:a,tags:["autodocs"],argTypes:{disabled:{control:"boolean"}}},s={args:{placeholder:"Type your message here."}},t={render:()=>e.jsxs("div",{className:"grid w-full gap-1.5",children:[e.jsx(r,{htmlFor:"message",children:"Your message"}),e.jsx(a,{placeholder:"Type your message here.",id:"message"})]})},o={args:{placeholder:"This textarea is disabled.",disabled:!0}},i={args:{defaultValue:"This is some pre-filled text content. You can edit this text to see how the textarea behaves with existing content."}},d={render:()=>e.jsxs("div",{className:"grid w-full gap-1.5",children:[e.jsx(r,{htmlFor:"bio",children:"Bio"}),e.jsx(a,{placeholder:"Tell us about yourself",id:"bio"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Your bio will be displayed on your public profile."})]})},l={render:()=>e.jsxs("div",{className:"w-full max-w-md space-y-4",children:[e.jsxs("div",{className:"grid gap-1.5",children:[e.jsx(r,{htmlFor:"subject",children:"Subject"}),e.jsx("input",{type:"text",id:"subject",className:"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",placeholder:"What is this regarding?"})]}),e.jsxs("div",{className:"grid gap-1.5",children:[e.jsx(r,{htmlFor:"description",children:"Description"}),e.jsx(a,{id:"description",placeholder:"Please provide as much detail as possible...",className:"min-h-[150px]"})]}),e.jsx(m,{className:"w-full",children:"Submit"})]})},c={render:()=>e.jsxs("div",{className:"grid w-full gap-1.5",children:[e.jsx(r,{htmlFor:"limited",children:"Message (max 280 characters)"}),e.jsx(a,{id:"limited",placeholder:"Type your message...",maxLength:280,className:"resize-none"}),e.jsx("p",{className:"text-right text-sm text-muted-foreground",children:"0 / 280"})]})},n={render:()=>e.jsxs("div",{className:"w-full max-w-md space-y-4 rounded-lg border p-4",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"font-semibold",children:"Share Your Feedback"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"We value your input to help us improve our platform."})]}),e.jsxs("div",{className:"grid gap-1.5",children:[e.jsx(r,{htmlFor:"feedback",children:"Your Feedback"}),e.jsx(a,{id:"feedback",placeholder:"What can we do better? Any features you'd like to see?",className:"min-h-[120px]"})]}),e.jsxs("div",{className:"flex justify-end gap-2",children:[e.jsx(m,{variant:"outline",children:"Cancel"}),e.jsx(m,{children:"Submit Feedback"})]})]})};var p,u,h;s.parameters={...s.parameters,docs:{...(p=s.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    placeholder: 'Type your message here.'
  }
}`,...(h=(u=s.parameters)==null?void 0:u.docs)==null?void 0:h.source}}};var x,g,b;t.parameters={...t.parameters,docs:{...(x=t.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => <div className="grid w-full gap-1.5">
      <Label htmlFor="message">Your message</Label>
      <Textarea placeholder="Type your message here." id="message" />
    </div>
}`,...(b=(g=t.parameters)==null?void 0:g.docs)==null?void 0:b.source}}};var f,v,j;o.parameters={...o.parameters,docs:{...(f=o.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    placeholder: 'This textarea is disabled.',
    disabled: true
  }
}`,...(j=(v=o.parameters)==null?void 0:v.docs)==null?void 0:j.source}}};var y,N,w;i.parameters={...i.parameters,docs:{...(y=i.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    defaultValue: 'This is some pre-filled text content. You can edit this text to see how the textarea behaves with existing content.'
  }
}`,...(w=(N=i.parameters)==null?void 0:N.docs)==null?void 0:w.source}}};var F,T,k;d.parameters={...d.parameters,docs:{...(F=d.parameters)==null?void 0:F.docs,source:{originalSource:`{
  render: () => <div className="grid w-full gap-1.5">
      <Label htmlFor="bio">Bio</Label>
      <Textarea placeholder="Tell us about yourself" id="bio" />
      <p className="text-sm text-muted-foreground">
        Your bio will be displayed on your public profile.
      </p>
    </div>
}`,...(k=(T=d.parameters)==null?void 0:T.docs)==null?void 0:k.source}}};var L,S,W;l.parameters={...l.parameters,docs:{...(L=l.parameters)==null?void 0:L.docs,source:{originalSource:`{
  render: () => <div className="w-full max-w-md space-y-4">
      <div className="grid gap-1.5">
        <Label htmlFor="subject">Subject</Label>
        <input type="text" id="subject" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="What is this regarding?" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Please provide as much detail as possible..." className="min-h-[150px]" />
      </div>
      <Button className="w-full">Submit</Button>
    </div>
}`,...(W=(S=l.parameters)==null?void 0:S.docs)==null?void 0:W.source}}};var B,Y,D;c.parameters={...c.parameters,docs:{...(B=c.parameters)==null?void 0:B.docs,source:{originalSource:`{
  render: () => <div className="grid w-full gap-1.5">
      <Label htmlFor="limited">Message (max 280 characters)</Label>
      <Textarea id="limited" placeholder="Type your message..." maxLength={280} className="resize-none" />
      <p className="text-right text-sm text-muted-foreground">0 / 280</p>
    </div>
}`,...(D=(Y=c.parameters)==null?void 0:Y.docs)==null?void 0:D.source}}};var C,E,V;n.parameters={...n.parameters,docs:{...(C=n.parameters)==null?void 0:C.docs,source:{originalSource:`{
  render: () => <div className="w-full max-w-md space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="font-semibold">Share Your Feedback</h3>
        <p className="text-sm text-muted-foreground">
          We value your input to help us improve our platform.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="feedback">Your Feedback</Label>
        <Textarea id="feedback" placeholder="What can we do better? Any features you'd like to see?" className="min-h-[120px]" />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Submit Feedback</Button>
      </div>
    </div>
}`,...(V=(E=n.parameters)==null?void 0:E.docs)==null?void 0:V.source}}};const Z=["Default","WithLabel","Disabled","WithValue","WithDescription","FormExample","CharacterCount","FeedbackForm"];export{c as CharacterCount,s as Default,o as Disabled,n as FeedbackForm,l as FormExample,d as WithDescription,t as WithLabel,i as WithValue,Z as __namedExportsOrder,X as default};
