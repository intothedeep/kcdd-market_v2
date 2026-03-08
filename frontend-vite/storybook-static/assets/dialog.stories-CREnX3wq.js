import{j as e}from"./jsx-runtime-Z5uAzocK.js";import{r as f}from"./index-pP6CS22B.js";import{R as A,T as R,P as V,C as _,a as Y,b as L,D as E,O as H}from"./index-DHXuv70o.js";import{c as t}from"./utils-BLSKlp9E.js";import{X as P}from"./x-BIbbIgdI.js";import{B as i}from"./button-Cophts_w.js";import{I as c}from"./input-DRLCrBPJ.js";import{L as g}from"./label-BhlulYsX.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-BYUIXDsI.js";import"./index-Bvak3XBe.js";import"./index-x8NkB57A.js";import"./index-Czt2WBNw.js";import"./index-xdNYasdH.js";import"./index-Ck0Qw0kh.js";import"./index-F0R8IyTw.js";import"./index-DSMx10ar.js";import"./index-CAIBKOjf.js";import"./index-CbcPFHB_.js";import"./createLucideIcon-DNXvdQsS.js";import"./index-cAPKYzjE.js";import"./index-1evVQkiP.js";const m=A,j=R,U=V,N=f.forwardRef(({className:a,...o},n)=>e.jsx(H,{ref:n,className:t("fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",a),...o}));N.displayName=H.displayName;const s=f.forwardRef(({className:a,children:o,...n},k)=>e.jsxs(U,{children:[e.jsx(N,{}),e.jsxs(_,{ref:k,className:t("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",a),...n,children:[o,e.jsxs(Y,{className:"absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",children:[e.jsx(P,{className:"h-4 w-4"}),e.jsx("span",{className:"sr-only",children:"Close"})]})]})]}));s.displayName=_.displayName;const r=({className:a,...o})=>e.jsx("div",{className:t("flex flex-col space-y-1.5 text-center sm:text-left",a),...o});r.displayName="DialogHeader";const p=({className:a,...o})=>e.jsx("div",{className:t("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",a),...o});p.displayName="DialogFooter";const l=f.forwardRef(({className:a,...o},n)=>e.jsx(L,{ref:n,className:t("text-lg font-semibold leading-none tracking-tight",a),...o}));l.displayName=L.displayName;const d=f.forwardRef(({className:a,...o},n)=>e.jsx(E,{ref:n,className:t("text-sm text-muted-foreground",a),...o}));d.displayName=E.displayName;N.__docgenInfo={description:"",methods:[]};s.__docgenInfo={description:"",methods:[]};r.__docgenInfo={description:"",methods:[],displayName:"DialogHeader"};p.__docgenInfo={description:"",methods:[],displayName:"DialogFooter"};l.__docgenInfo={description:"",methods:[]};d.__docgenInfo={description:"",methods:[]};const me={title:"UI/Dialog",component:m,tags:["autodocs"]},u={render:()=>e.jsxs(m,{children:[e.jsx(j,{asChild:!0,children:e.jsx(i,{variant:"outline",children:"Open Dialog"})}),e.jsxs(s,{className:"sm:max-w-[425px]",children:[e.jsxs(r,{children:[e.jsx(l,{children:"Edit profile"}),e.jsx(d,{children:"Make changes to your profile here. Click save when you're done."})]}),e.jsxs("div",{className:"grid gap-4 py-4",children:[e.jsxs("div",{className:"grid grid-cols-4 items-center gap-4",children:[e.jsx(g,{htmlFor:"name",className:"text-right",children:"Name"}),e.jsx(c,{id:"name",defaultValue:"John Doe",className:"col-span-3"})]}),e.jsxs("div",{className:"grid grid-cols-4 items-center gap-4",children:[e.jsx(g,{htmlFor:"username",className:"text-right",children:"Username"}),e.jsx(c,{id:"username",defaultValue:"@johndoe",className:"col-span-3"})]})]}),e.jsx(p,{children:e.jsx(i,{type:"submit",children:"Save changes"})})]})]})},h={render:()=>e.jsxs(m,{children:[e.jsx(j,{asChild:!0,children:e.jsx(i,{children:"Show Info"})}),e.jsx(s,{children:e.jsxs(r,{children:[e.jsx(l,{children:"Information"}),e.jsx(d,{children:"This is a simple dialog with just a title and description."})]})})]})},x={render:()=>e.jsxs(m,{children:[e.jsx(j,{asChild:!0,children:e.jsx(i,{children:"Add Organization"})}),e.jsxs(s,{className:"sm:max-w-[500px]",children:[e.jsxs(r,{children:[e.jsx(l,{children:"Add New Organization"}),e.jsx(d,{children:"Enter the details of the organization you want to add."})]}),e.jsxs("div",{className:"grid gap-4 py-4",children:[e.jsxs("div",{className:"grid gap-2",children:[e.jsx(g,{htmlFor:"org-name",children:"Organization Name"}),e.jsx(c,{id:"org-name",placeholder:"Enter organization name"})]}),e.jsxs("div",{className:"grid gap-2",children:[e.jsx(g,{htmlFor:"org-email",children:"Email"}),e.jsx(c,{id:"org-email",type:"email",placeholder:"contact@organization.org"})]}),e.jsxs("div",{className:"grid gap-2",children:[e.jsx(g,{htmlFor:"org-website",children:"Website"}),e.jsx(c,{id:"org-website",placeholder:"https://organization.org"})]})]}),e.jsxs(p,{children:[e.jsx(i,{variant:"outline",children:"Cancel"}),e.jsx(i,{type:"submit",children:"Add Organization"})]})]})]})},D={render:()=>e.jsxs(m,{children:[e.jsx(j,{asChild:!0,children:e.jsx(i,{variant:"destructive",children:"Cancel Subscription"})}),e.jsxs(s,{children:[e.jsxs(r,{children:[e.jsx(l,{children:"Cancel Subscription"}),e.jsx(d,{children:"Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period."})]}),e.jsxs(p,{className:"gap-2 sm:gap-0",children:[e.jsx(i,{variant:"outline",children:"Keep Subscription"}),e.jsx(i,{variant:"destructive",children:"Yes, Cancel"})]})]})]})};var v,y,b;u.parameters={...u.parameters,docs:{...(v=u.parameters)==null?void 0:v.docs,source:{originalSource:`{
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
}`,...(b=(y=u.parameters)==null?void 0:y.docs)==null?void 0:b.source}}};var C,w,T;h.parameters={...h.parameters,docs:{...(C=h.parameters)==null?void 0:C.docs,source:{originalSource:`{
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
}`,...(T=(w=h.parameters)==null?void 0:w.docs)==null?void 0:T.source}}};var F,z,B;x.parameters={...x.parameters,docs:{...(F=x.parameters)==null?void 0:F.docs,source:{originalSource:`{
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
}`,...(B=(z=x.parameters)==null?void 0:z.docs)==null?void 0:B.source}}};var I,S,O;D.parameters={...D.parameters,docs:{...(I=D.parameters)==null?void 0:I.docs,source:{originalSource:`{
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
}`,...(O=(S=D.parameters)==null?void 0:S.docs)==null?void 0:O.source}}};const pe=["Default","SimpleDialog","FormDialog","ConfirmationDialog"];export{D as ConfirmationDialog,u as Default,x as FormDialog,h as SimpleDialog,pe as __namedExportsOrder,me as default};
