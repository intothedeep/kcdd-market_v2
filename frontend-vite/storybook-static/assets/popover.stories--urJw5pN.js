import{j as e}from"./jsx-runtime-Z5uAzocK.js";import{P as o,a as t,b as r}from"./popover-DcztouLV.js";import{B as s}from"./button-Cophts_w.js";import{I as d}from"./input-DRLCrBPJ.js";import{L as p}from"./label-BhlulYsX.js";import"./index-pP6CS22B.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-BYUIXDsI.js";import"./index-Bvak3XBe.js";import"./index-x8NkB57A.js";import"./index-F0R8IyTw.js";import"./index-DSMx10ar.js";import"./index-xdNYasdH.js";import"./index-2Uu5snjE.js";import"./index-Czt2WBNw.js";import"./index-BUQy0IMf.js";import"./index-n-b12q8t.js";import"./index-CbcPFHB_.js";import"./index-Ck0Qw0kh.js";import"./utils-BLSKlp9E.js";import"./index-cAPKYzjE.js";import"./index-1evVQkiP.js";const z={title:"UI/Popover",component:o,tags:["autodocs"]},n={render:()=>e.jsxs(o,{children:[e.jsx(t,{asChild:!0,children:e.jsx(s,{variant:"outline",children:"Open Popover"})}),e.jsx(r,{className:"w-80",children:e.jsxs("div",{className:"grid gap-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx("h4",{className:"font-medium leading-none",children:"Dimensions"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Set the dimensions for the layer."})]}),e.jsxs("div",{className:"grid gap-2",children:[e.jsxs("div",{className:"grid grid-cols-3 items-center gap-4",children:[e.jsx(p,{htmlFor:"width",children:"Width"}),e.jsx(d,{id:"width",defaultValue:"100%",className:"col-span-2 h-8"})]}),e.jsxs("div",{className:"grid grid-cols-3 items-center gap-4",children:[e.jsx(p,{htmlFor:"maxWidth",children:"Max. width"}),e.jsx(d,{id:"maxWidth",defaultValue:"300px",className:"col-span-2 h-8"})]}),e.jsxs("div",{className:"grid grid-cols-3 items-center gap-4",children:[e.jsx(p,{htmlFor:"height",children:"Height"}),e.jsx(d,{id:"height",defaultValue:"25px",className:"col-span-2 h-8"})]})]})]})})]})},i={render:()=>e.jsxs(o,{children:[e.jsx(t,{asChild:!0,children:e.jsx(s,{variant:"outline",children:"Info"})}),e.jsx(r,{children:e.jsx("p",{className:"text-sm",children:"This is a simple popover with some text content."})})]})},a={render:()=>e.jsxs("div",{className:"flex items-center justify-center gap-4 p-20",children:[e.jsxs(o,{children:[e.jsx(t,{asChild:!0,children:e.jsx(s,{variant:"outline",children:"Top"})}),e.jsx(r,{side:"top",children:e.jsx("p",{className:"text-sm",children:"Popover on top"})})]}),e.jsxs(o,{children:[e.jsx(t,{asChild:!0,children:e.jsx(s,{variant:"outline",children:"Right"})}),e.jsx(r,{side:"right",children:e.jsx("p",{className:"text-sm",children:"Popover on right"})})]}),e.jsxs(o,{children:[e.jsx(t,{asChild:!0,children:e.jsx(s,{variant:"outline",children:"Bottom"})}),e.jsx(r,{side:"bottom",children:e.jsx("p",{className:"text-sm",children:"Popover on bottom"})})]}),e.jsxs(o,{children:[e.jsx(t,{asChild:!0,children:e.jsx(s,{variant:"outline",children:"Left"})}),e.jsx(r,{side:"left",children:e.jsx("p",{className:"text-sm",children:"Popover on left"})})]})]})},l={render:()=>e.jsxs(o,{children:[e.jsx(t,{asChild:!0,children:e.jsx(s,{variant:"outline",children:"View Profile"})}),e.jsx(r,{className:"w-80",children:e.jsxs("div",{className:"flex gap-4",children:[e.jsx("div",{className:"flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-semibold",children:"JD"}),e.jsxs("div",{className:"space-y-1",children:[e.jsx("h4",{className:"font-semibold",children:"John Doe"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"john.doe@example.com"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Product Designer"})]})]})})]})};var c,m,h;n.parameters={...n.parameters,docs:{...(c=n.parameters)==null?void 0:c.docs,source:{originalSource:`{
  render: () => <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Dimensions</h4>
            <p className="text-sm text-muted-foreground">Set the dimensions for the layer.</p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="width">Width</Label>
              <Input id="width" defaultValue="100%" className="col-span-2 h-8" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxWidth">Max. width</Label>
              <Input id="maxWidth" defaultValue="300px" className="col-span-2 h-8" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="height">Height</Label>
              <Input id="height" defaultValue="25px" className="col-span-2 h-8" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
}`,...(h=(m=n.parameters)==null?void 0:m.docs)==null?void 0:h.source}}};var v,x,u;i.parameters={...i.parameters,docs:{...(v=i.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: () => <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Info</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-sm">This is a simple popover with some text content.</p>
      </PopoverContent>
    </Popover>
}`,...(u=(x=i.parameters)==null?void 0:x.docs)==null?void 0:u.source}}};var g,P,j;a.parameters={...a.parameters,docs:{...(g=a.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => <div className="flex items-center justify-center gap-4 p-20">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Top</Button>
        </PopoverTrigger>
        <PopoverContent side="top">
          <p className="text-sm">Popover on top</p>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Right</Button>
        </PopoverTrigger>
        <PopoverContent side="right">
          <p className="text-sm">Popover on right</p>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </PopoverTrigger>
        <PopoverContent side="bottom">
          <p className="text-sm">Popover on bottom</p>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Left</Button>
        </PopoverTrigger>
        <PopoverContent side="left">
          <p className="text-sm">Popover on left</p>
        </PopoverContent>
      </Popover>
    </div>
}`,...(j=(P=a.parameters)==null?void 0:P.docs)==null?void 0:j.source}}};var f,N,C;l.parameters={...l.parameters,docs:{...(f=l.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">View Profile</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-semibold">
            JD
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold">John Doe</h4>
            <p className="text-sm text-muted-foreground">john.doe@example.com</p>
            <p className="text-sm text-muted-foreground">Product Designer</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
}`,...(C=(N=l.parameters)==null?void 0:N.docs)==null?void 0:C.source}}};const A=["Default","SimpleContent","Positioning","UserProfile"];export{n as Default,a as Positioning,i as SimpleContent,l as UserProfile,A as __namedExportsOrder,z as default};
