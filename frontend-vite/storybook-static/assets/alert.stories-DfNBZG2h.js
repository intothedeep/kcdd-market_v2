import{j as e}from"./jsx-runtime-Z5uAzocK.js";import{r as g}from"./index-pP6CS22B.js";import{c as L}from"./index-1evVQkiP.js";import{c as h}from"./utils-BLSKlp9E.js";import{c as A}from"./createLucideIcon-DNXvdQsS.js";import{A as M}from"./alert-circle-VBFkfnNt.js";import"./_commonjsHelpers-Cpj98o6Y.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const P=A("AlertTriangle",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z",key:"c3ski4"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R=A("CheckCircle2",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const V=A("Info",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]]),z=L("relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",{variants:{variant:{default:"bg-background text-foreground",destructive:"border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"}},defaultVariants:{variant:"default"}}),r=g.forwardRef(({className:n,variant:l,...a},u)=>e.jsx("div",{ref:u,role:"alert",className:h(z({variant:l}),n),...a}));r.displayName="Alert";const s=g.forwardRef(({className:n,children:l,...a},u)=>e.jsx("h5",{ref:u,className:h("mb-1 font-medium leading-none tracking-tight",n),...a,children:l}));s.displayName="AlertTitle";const t=g.forwardRef(({className:n,...l},a)=>e.jsx("div",{ref:a,className:h("text-sm [&_p]:leading-relaxed",n),...l}));t.displayName="AlertDescription";r.__docgenInfo={description:"",methods:[],displayName:"Alert"};s.__docgenInfo={description:"",methods:[],displayName:"AlertTitle"};t.__docgenInfo={description:"",methods:[],displayName:"AlertDescription"};const G={title:"UI/Alert",component:r,tags:["autodocs"],argTypes:{variant:{control:"select",options:["default","destructive"]}}},i={render:()=>e.jsxs(r,{children:[e.jsx(s,{children:"Heads up!"}),e.jsx(t,{children:"You can add components and dependencies to your app using the CLI."})]})},c={render:()=>e.jsxs(r,{variant:"destructive",children:[e.jsx(M,{className:"h-4 w-4"}),e.jsx(s,{children:"Error"}),e.jsx(t,{children:"Your session has expired. Please log in again to continue."})]})},o={render:()=>e.jsxs(r,{children:[e.jsx(V,{className:"h-4 w-4"}),e.jsx(s,{children:"Information"}),e.jsx(t,{children:"This is an informational message with an icon."})]})},d={render:()=>e.jsxs(r,{className:"border-green-500 bg-green-50 text-green-800 [&>svg]:text-green-600",children:[e.jsx(R,{className:"h-4 w-4"}),e.jsx(s,{children:"Success!"}),e.jsx(t,{children:"Your changes have been saved successfully."})]})},m={render:()=>e.jsxs(r,{className:"border-yellow-500 bg-yellow-50 text-yellow-800 [&>svg]:text-yellow-600",children:[e.jsx(P,{className:"h-4 w-4"}),e.jsx(s,{children:"Warning"}),e.jsx(t,{children:"This action cannot be undone. Please proceed with caution."})]})},p={render:()=>e.jsxs("div",{className:"flex flex-col gap-4",children:[e.jsxs(r,{children:[e.jsx(V,{className:"h-4 w-4"}),e.jsx(s,{children:"Default Alert"}),e.jsx(t,{children:"This is the default alert style."})]}),e.jsxs(r,{variant:"destructive",children:[e.jsx(M,{className:"h-4 w-4"}),e.jsx(s,{children:"Destructive Alert"}),e.jsx(t,{children:"This indicates an error or destructive action."})]}),e.jsxs(r,{className:"border-green-500 bg-green-50 text-green-800 [&>svg]:text-green-600",children:[e.jsx(R,{className:"h-4 w-4"}),e.jsx(s,{children:"Success Alert"}),e.jsx(t,{children:"Custom success styling using className."})]}),e.jsxs(r,{className:"border-yellow-500 bg-yellow-50 text-yellow-800 [&>svg]:text-yellow-600",children:[e.jsx(P,{className:"h-4 w-4"}),e.jsx(s,{children:"Warning Alert"}),e.jsx(t,{children:"Custom warning styling using className."})]})]})};var x,v,f;i.parameters={...i.parameters,docs:{...(x=i.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => <Alert>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components and dependencies to your app using the CLI.
      </AlertDescription>
    </Alert>
}`,...(f=(v=i.parameters)==null?void 0:v.docs)==null?void 0:f.source}}};var y,j,w;c.parameters={...c.parameters,docs:{...(y=c.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again to continue.
      </AlertDescription>
    </Alert>
}`,...(w=(j=c.parameters)==null?void 0:j.docs)==null?void 0:w.source}}};var N,T,D;o.parameters={...o.parameters,docs:{...(N=o.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: () => <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Information</AlertTitle>
      <AlertDescription>This is an informational message with an icon.</AlertDescription>
    </Alert>
}`,...(D=(T=o.parameters)==null?void 0:T.docs)==null?void 0:D.source}}};var b,C,k;d.parameters={...d.parameters,docs:{...(b=d.parameters)==null?void 0:b.docs,source:{originalSource:`{
  render: () => <Alert className="border-green-500 bg-green-50 text-green-800 [&>svg]:text-green-600">
      <CheckCircle2 className="h-4 w-4" />
      <AlertTitle>Success!</AlertTitle>
      <AlertDescription>Your changes have been saved successfully.</AlertDescription>
    </Alert>
}`,...(k=(C=d.parameters)==null?void 0:C.docs)==null?void 0:k.source}}};var I,S,_;m.parameters={...m.parameters,docs:{...(I=m.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: () => <Alert className="border-yellow-500 bg-yellow-50 text-yellow-800 [&>svg]:text-yellow-600">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>
        This action cannot be undone. Please proceed with caution.
      </AlertDescription>
    </Alert>
}`,...(_=(S=m.parameters)==null?void 0:S.docs)==null?void 0:_.source}}};var W,Y,E;p.parameters={...p.parameters,docs:{...(W=p.parameters)==null?void 0:W.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Default Alert</AlertTitle>
        <AlertDescription>This is the default alert style.</AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Destructive Alert</AlertTitle>
        <AlertDescription>This indicates an error or destructive action.</AlertDescription>
      </Alert>

      <Alert className="border-green-500 bg-green-50 text-green-800 [&>svg]:text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Success Alert</AlertTitle>
        <AlertDescription>Custom success styling using className.</AlertDescription>
      </Alert>

      <Alert className="border-yellow-500 bg-yellow-50 text-yellow-800 [&>svg]:text-yellow-600">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Warning Alert</AlertTitle>
        <AlertDescription>Custom warning styling using className.</AlertDescription>
      </Alert>
    </div>
}`,...(E=(Y=p.parameters)==null?void 0:Y.docs)==null?void 0:E.source}}};const J=["Default","Destructive","WithIcon","Success","Warning","AllVariants"];export{p as AllVariants,i as Default,c as Destructive,d as Success,m as Warning,o as WithIcon,J as __namedExportsOrder,G as default};
