import{j as e}from"./jsx-runtime-Z5uAzocK.js";import{D as o,a as d,b as c,c as g,d as m,e as p,f as u}from"./dialog-BtkkNcAV.js";import{B as i}from"./button-Cophts_w.js";import{I as a}from"./input-DRLCrBPJ.js";import{L as n}from"./label-BhlulYsX.js";import"./index-pP6CS22B.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-CFn2u_c2.js";import"./index-BYUIXDsI.js";import"./index-Bvak3XBe.js";import"./index-x8NkB57A.js";import"./index-Czt2WBNw.js";import"./index-xdNYasdH.js";import"./index-Ck0Qw0kh.js";import"./index-F0R8IyTw.js";import"./index-DSMx10ar.js";import"./index-2Uu5snjE.js";import"./index-CbcPFHB_.js";import"./utils-BLSKlp9E.js";import"./x-BIbbIgdI.js";import"./createLucideIcon-DNXvdQsS.js";import"./index-cAPKYzjE.js";import"./index-1evVQkiP.js";const Q={title:"UI/Dialog",component:o,tags:["autodocs"]},r={render:()=>e.jsxs(o,{children:[e.jsx(d,{asChild:!0,children:e.jsx(i,{variant:"outline",children:"Open Dialog"})}),e.jsxs(c,{className:"sm:max-w-[425px]",children:[e.jsxs(g,{children:[e.jsx(m,{children:"Edit profile"}),e.jsx(p,{children:"Make changes to your profile here. Click save when you're done."})]}),e.jsxs("div",{className:"grid gap-4 py-4",children:[e.jsxs("div",{className:"grid grid-cols-4 items-center gap-4",children:[e.jsx(n,{htmlFor:"name",className:"text-right",children:"Name"}),e.jsx(a,{id:"name",defaultValue:"John Doe",className:"col-span-3"})]}),e.jsxs("div",{className:"grid grid-cols-4 items-center gap-4",children:[e.jsx(n,{htmlFor:"username",className:"text-right",children:"Username"}),e.jsx(a,{id:"username",defaultValue:"@johndoe",className:"col-span-3"})]})]}),e.jsx(u,{children:e.jsx(i,{type:"submit",children:"Save changes"})})]})]})},t={render:()=>e.jsxs(o,{children:[e.jsx(d,{asChild:!0,children:e.jsx(i,{children:"Show Info"})}),e.jsx(c,{children:e.jsxs(g,{children:[e.jsx(m,{children:"Information"}),e.jsx(p,{children:"This is a simple dialog with just a title and description."})]})})]})},s={render:()=>e.jsxs(o,{children:[e.jsx(d,{asChild:!0,children:e.jsx(i,{children:"Add Organization"})}),e.jsxs(c,{className:"sm:max-w-[500px]",children:[e.jsxs(g,{children:[e.jsx(m,{children:"Add New Organization"}),e.jsx(p,{children:"Enter the details of the organization you want to add."})]}),e.jsxs("div",{className:"grid gap-4 py-4",children:[e.jsxs("div",{className:"grid gap-2",children:[e.jsx(n,{htmlFor:"org-name",children:"Organization Name"}),e.jsx(a,{id:"org-name",placeholder:"Enter organization name"})]}),e.jsxs("div",{className:"grid gap-2",children:[e.jsx(n,{htmlFor:"org-email",children:"Email"}),e.jsx(a,{id:"org-email",type:"email",placeholder:"contact@organization.org"})]}),e.jsxs("div",{className:"grid gap-2",children:[e.jsx(n,{htmlFor:"org-website",children:"Website"}),e.jsx(a,{id:"org-website",placeholder:"https://organization.org"})]})]}),e.jsxs(u,{children:[e.jsx(i,{variant:"outline",children:"Cancel"}),e.jsx(i,{type:"submit",children:"Add Organization"})]})]})]})},l={render:()=>e.jsxs(o,{children:[e.jsx(d,{asChild:!0,children:e.jsx(i,{variant:"destructive",children:"Cancel Subscription"})}),e.jsxs(c,{children:[e.jsxs(g,{children:[e.jsx(m,{children:"Cancel Subscription"}),e.jsx(p,{children:"Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period."})]}),e.jsxs(u,{className:"gap-2 sm:gap-0",children:[e.jsx(i,{variant:"outline",children:"Keep Subscription"}),e.jsx(i,{variant:"destructive",children:"Yes, Cancel"})]})]})]})};var h,D,x;r.parameters={...r.parameters,docs:{...(h=r.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" defaultValue="John Doe" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input id="username" defaultValue="@johndoe" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
}`,...(x=(D=r.parameters)==null?void 0:D.docs)==null?void 0:x.source}}};var j,v,N;t.parameters={...t.parameters,docs:{...(j=t.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => <Dialog>
      <DialogTrigger asChild>
        <Button>Show Info</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Information</DialogTitle>
          <DialogDescription>
            This is a simple dialog with just a title and description.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
}`,...(N=(v=t.parameters)==null?void 0:v.docs)==null?void 0:N.source}}};var b,f,C;s.parameters={...s.parameters,docs:{...(b=s.parameters)==null?void 0:b.docs,source:{originalSource:`{
  render: () => <Dialog>
      <DialogTrigger asChild>
        <Button>Add Organization</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Organization</DialogTitle>
          <DialogDescription>
            Enter the details of the organization you want to add.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input id="org-name" placeholder="Enter organization name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="org-email">Email</Label>
            <Input id="org-email" type="email" placeholder="contact@organization.org" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="org-website">Website</Label>
            <Input id="org-website" placeholder="https://organization.org" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button type="submit">Add Organization</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
}`,...(C=(f=s.parameters)==null?void 0:f.docs)==null?void 0:C.source}}};var y,w,B;l.parameters={...l.parameters,docs:{...(y=l.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Cancel Subscription</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Subscription</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel your subscription? You will lose access to premium
            features at the end of your billing period.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline">Keep Subscription</Button>
          <Button variant="destructive">Yes, Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
}`,...(B=(w=l.parameters)==null?void 0:w.docs)==null?void 0:B.source}}};const X=["Default","SimpleDialog","FormDialog","ConfirmationDialog"];export{l as ConfirmationDialog,r as Default,s as FormDialog,t as SimpleDialog,X as __namedExportsOrder,Q as default};
