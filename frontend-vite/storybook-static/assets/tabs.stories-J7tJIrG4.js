import{j as e}from"./jsx-runtime-Z5uAzocK.js";import{r as m}from"./index-pP6CS22B.js";import{P as w,c as L,a as oe}from"./index-BYUIXDsI.js";import{R as le,I as ce,c as J}from"./index-Dlkq-JTY.js";import{P as de}from"./index-CbcPFHB_.js";import{u as ue}from"./index-C7OyeuXp.js";import{u as me}from"./index-Ck0Qw0kh.js";import{u as pe}from"./index-Czt2WBNw.js";import{c as D}from"./utils-BLSKlp9E.js";import{C as V,a as A,b as _,c as P,d as R}from"./card-CMoSCf_M.js";import{B as be}from"./button-Cophts_w.js";import{I as g}from"./input-DRLCrBPJ.js";import{L as v}from"./label-BhlulYsX.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-Bvak3XBe.js";import"./index-x8NkB57A.js";import"./index-CuoSMrXm.js";import"./index-DSMx10ar.js";import"./index-xdNYasdH.js";import"./index-cAPKYzjE.js";import"./index-1evVQkiP.js";var I="Tabs",[ge]=oe(I,[J]),W=J(),[ve,S]=ge(I),q=m.forwardRef((a,s)=>{const{__scopeTabs:n,value:i,onValueChange:c,defaultValue:u,orientation:o="horizontal",dir:p,activationMode:h="automatic",...f}=a,d=ue(p),[l,b]=me({prop:i,onChange:c,defaultProp:u??"",caller:I});return e.jsx(ve,{scope:n,baseId:pe(),value:l,onValueChange:b,orientation:o,dir:d,activationMode:h,children:e.jsx(w.div,{dir:d,"data-orientation":o,...f,ref:s})})});q.displayName=I;var Q="TabsList",X=m.forwardRef((a,s)=>{const{__scopeTabs:n,loop:i=!0,...c}=a,u=S(Q,n),o=W(n);return e.jsx(le,{asChild:!0,...o,orientation:u.orientation,dir:u.dir,loop:i,children:e.jsx(w.div,{role:"tablist","aria-orientation":u.orientation,...c,ref:s})})});X.displayName=Q;var Y="TabsTrigger",Z=m.forwardRef((a,s)=>{const{__scopeTabs:n,value:i,disabled:c=!1,...u}=a,o=S(Y,n),p=W(n),h=se(o.baseId,i),f=ne(o.baseId,i),d=i===o.value;return e.jsx(ce,{asChild:!0,...p,focusable:!c,active:d,children:e.jsx(w.button,{type:"button",role:"tab","aria-selected":d,"aria-controls":f,"data-state":d?"active":"inactive","data-disabled":c?"":void 0,disabled:c,id:h,...u,ref:s,onMouseDown:L(a.onMouseDown,l=>{!c&&l.button===0&&l.ctrlKey===!1?o.onValueChange(i):l.preventDefault()}),onKeyDown:L(a.onKeyDown,l=>{[" ","Enter"].includes(l.key)&&o.onValueChange(i)}),onFocus:L(a.onFocus,()=>{const l=o.activationMode!=="manual";!d&&!c&&l&&o.onValueChange(i)})})})});Z.displayName=Y;var ee="TabsContent",ae=m.forwardRef((a,s)=>{const{__scopeTabs:n,value:i,forceMount:c,children:u,...o}=a,p=S(ee,n),h=se(p.baseId,i),f=ne(p.baseId,i),d=i===p.value,l=m.useRef(d);return m.useEffect(()=>{const b=requestAnimationFrame(()=>l.current=!1);return()=>cancelAnimationFrame(b)},[]),e.jsx(de,{present:c||d,children:({present:b})=>e.jsx(w.div,{"data-state":d?"active":"inactive","data-orientation":p.orientation,role:"tabpanel","aria-labelledby":h,hidden:!b,id:f,tabIndex:0,...o,ref:s,style:{...a.style,animationDuration:l.current?"0s":void 0},children:b&&u})})});ae.displayName=ee;function se(a,s){return`${a}-trigger-${s}`}function ne(a,s){return`${a}-content-${s}`}var xe=q,te=X,re=Z,ie=ae;const T=xe,x=m.forwardRef(({className:a,...s},n)=>e.jsx(te,{ref:n,className:D("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",a),...s}));x.displayName=te.displayName;const t=m.forwardRef(({className:a,...s},n)=>e.jsx(re,{ref:n,className:D("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",a),...s}));t.displayName=re.displayName;const r=m.forwardRef(({className:a,...s},n)=>e.jsx(ie,{ref:n,className:D("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",a),...s}));r.displayName=ie.displayName;x.__docgenInfo={description:"",methods:[]};t.__docgenInfo={description:"",methods:[]};r.__docgenInfo={description:"",methods:[]};const Be={title:"UI/Tabs",component:T,tags:["autodocs"]},N={render:()=>e.jsxs(T,{defaultValue:"account",className:"w-[400px]",children:[e.jsxs(x,{children:[e.jsx(t,{value:"account",children:"Account"}),e.jsx(t,{value:"password",children:"Password"})]}),e.jsx(r,{value:"account",children:e.jsxs(V,{children:[e.jsxs(A,{children:[e.jsx(_,{children:"Account"}),e.jsx(P,{children:"Make changes to your account here. Click save when you're done."})]}),e.jsxs(R,{className:"space-y-2",children:[e.jsxs("div",{className:"space-y-1",children:[e.jsx(v,{htmlFor:"name",children:"Name"}),e.jsx(g,{id:"name",defaultValue:"John Doe"})]}),e.jsxs("div",{className:"space-y-1",children:[e.jsx(v,{htmlFor:"username",children:"Username"}),e.jsx(g,{id:"username",defaultValue:"@johndoe"})]})]})]})}),e.jsx(r,{value:"password",children:e.jsxs(V,{children:[e.jsxs(A,{children:[e.jsx(_,{children:"Password"}),e.jsx(P,{children:"Change your password here."})]}),e.jsxs(R,{className:"space-y-2",children:[e.jsxs("div",{className:"space-y-1",children:[e.jsx(v,{htmlFor:"current",children:"Current password"}),e.jsx(g,{id:"current",type:"password"})]}),e.jsxs("div",{className:"space-y-1",children:[e.jsx(v,{htmlFor:"new",children:"New password"}),e.jsx(g,{id:"new",type:"password"})]})]})]})})]})},j={render:()=>e.jsxs(T,{defaultValue:"tab1",className:"w-[400px]",children:[e.jsxs(x,{className:"grid w-full grid-cols-3",children:[e.jsx(t,{value:"tab1",children:"Tab 1"}),e.jsx(t,{value:"tab2",children:"Tab 2"}),e.jsx(t,{value:"tab3",children:"Tab 3"})]}),e.jsx(r,{value:"tab1",className:"p-4",children:"Content for Tab 1"}),e.jsx(r,{value:"tab2",className:"p-4",children:"Content for Tab 2"}),e.jsx(r,{value:"tab3",className:"p-4",children:"Content for Tab 3"})]})},C={render:()=>e.jsxs(T,{defaultValue:"about",className:"w-full max-w-2xl",children:[e.jsxs(x,{children:[e.jsx(t,{value:"about",children:"About"}),e.jsx(t,{value:"campaigns",children:"Campaigns"}),e.jsx(t,{value:"impact",children:"Impact"}),e.jsx(t,{value:"team",children:"Team"})]}),e.jsx(r,{value:"about",className:"mt-4",children:e.jsxs("div",{className:"space-y-4",children:[e.jsx("h3",{className:"text-lg font-semibold",children:"About Us"}),e.jsx("p",{className:"text-muted-foreground",children:"We are a nonprofit organization dedicated to bridging the digital divide in underserved communities. Our mission is to provide technology resources and education to those who need it most."})]})}),e.jsx(r,{value:"campaigns",className:"mt-4",children:e.jsxs("div",{className:"space-y-4",children:[e.jsx("h3",{className:"text-lg font-semibold",children:"Active Campaigns"}),e.jsx("p",{className:"text-muted-foreground",children:"3 active campaigns raising funds for technology needs."})]})}),e.jsx(r,{value:"impact",className:"mt-4",children:e.jsxs("div",{className:"space-y-4",children:[e.jsx("h3",{className:"text-lg font-semibold",children:"Our Impact"}),e.jsxs("div",{className:"grid grid-cols-3 gap-4",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"text-2xl font-bold",children:"500+"}),e.jsx("div",{className:"text-sm text-muted-foreground",children:"Devices Donated"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"text-2xl font-bold",children:"1,200+"}),e.jsx("div",{className:"text-sm text-muted-foreground",children:"People Helped"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"text-2xl font-bold",children:"$50K"}),e.jsx("div",{className:"text-sm text-muted-foreground",children:"Raised"})]})]})]})}),e.jsx(r,{value:"team",className:"mt-4",children:e.jsxs("div",{className:"space-y-4",children:[e.jsx("h3",{className:"text-lg font-semibold",children:"Our Team"}),e.jsx("p",{className:"text-muted-foreground",children:"Meet the dedicated individuals behind our mission."})]})})]})},y={render:()=>e.jsxs(T,{defaultValue:"general",className:"w-full max-w-xl",children:[e.jsxs(x,{className:"grid w-full grid-cols-4",children:[e.jsx(t,{value:"general",children:"General"}),e.jsx(t,{value:"security",children:"Security"}),e.jsx(t,{value:"notifications",children:"Notifications"}),e.jsx(t,{value:"billing",children:"Billing"})]}),e.jsxs(r,{value:"general",className:"space-y-4 pt-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx(v,{children:"Display Name"}),e.jsx(g,{defaultValue:"John Doe"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(v,{children:"Email"}),e.jsx(g,{type:"email",defaultValue:"john@example.com"})]}),e.jsx(be,{children:"Save Changes"})]}),e.jsx(r,{value:"security",className:"pt-4",children:e.jsx("p",{className:"text-muted-foreground",children:"Security settings content here."})}),e.jsx(r,{value:"notifications",className:"pt-4",children:e.jsx("p",{className:"text-muted-foreground",children:"Notification preferences content here."})}),e.jsx(r,{value:"billing",className:"pt-4",children:e.jsx("p",{className:"text-muted-foreground",children:"Billing information content here."})})]})};var F,E,M;N.parameters={...N.parameters,docs:{...(F=N.parameters)==null?void 0:F.docs,source:{originalSource:`{
  render: () => <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Make changes to your account here. Click save when you&apos;re done.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="@johndoe" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your password here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" type="password" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
}`,...(M=(E=N.parameters)==null?void 0:E.docs)==null?void 0:M.source}}};var k,B,O;j.parameters={...j.parameters,docs:{...(k=j.parameters)==null?void 0:k.docs,source:{originalSource:`{
  render: () => <Tabs defaultValue="tab1" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1" className="p-4">
        Content for Tab 1
      </TabsContent>
      <TabsContent value="tab2" className="p-4">
        Content for Tab 2
      </TabsContent>
      <TabsContent value="tab3" className="p-4">
        Content for Tab 3
      </TabsContent>
    </Tabs>
}`,...(O=(B=j.parameters)==null?void 0:B.docs)==null?void 0:O.source}}};var $,G,H;C.parameters={...C.parameters,docs:{...($=C.parameters)==null?void 0:$.docs,source:{originalSource:`{
  render: () => <Tabs defaultValue="about" className="w-full max-w-2xl">
      <TabsList>
        <TabsTrigger value="about">About</TabsTrigger>
        <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        <TabsTrigger value="impact">Impact</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
      </TabsList>
      <TabsContent value="about" className="mt-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">About Us</h3>
          <p className="text-muted-foreground">
            We are a nonprofit organization dedicated to bridging the digital divide in underserved
            communities. Our mission is to provide technology resources and education to those who
            need it most.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="campaigns" className="mt-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Campaigns</h3>
          <p className="text-muted-foreground">
            3 active campaigns raising funds for technology needs.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="impact" className="mt-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Our Impact</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">500+</div>
              <div className="text-sm text-muted-foreground">Devices Donated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">1,200+</div>
              <div className="text-sm text-muted-foreground">People Helped</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">$50K</div>
              <div className="text-sm text-muted-foreground">Raised</div>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="team" className="mt-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Our Team</h3>
          <p className="text-muted-foreground">
            Meet the dedicated individuals behind our mission.
          </p>
        </div>
      </TabsContent>
    </Tabs>
}`,...(H=(G=C.parameters)==null?void 0:G.docs)==null?void 0:H.source}}};var z,K,U;y.parameters={...y.parameters,docs:{...(z=y.parameters)==null?void 0:z.docs,source:{originalSource:`{
  render: () => <Tabs defaultValue="general" className="w-full max-w-xl">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label>Display Name</Label>
          <Input defaultValue="John Doe" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" defaultValue="john@example.com" />
        </div>
        <Button>Save Changes</Button>
      </TabsContent>
      <TabsContent value="security" className="pt-4">
        <p className="text-muted-foreground">Security settings content here.</p>
      </TabsContent>
      <TabsContent value="notifications" className="pt-4">
        <p className="text-muted-foreground">Notification preferences content here.</p>
      </TabsContent>
      <TabsContent value="billing" className="pt-4">
        <p className="text-muted-foreground">Billing information content here.</p>
      </TabsContent>
    </Tabs>
}`,...(U=(K=y.parameters)==null?void 0:K.docs)==null?void 0:U.source}}};const Oe=["Default","SimpleTabs","OrganizationProfile","SettingsTabs"];export{N as Default,C as OrganizationProfile,y as SettingsTabs,j as SimpleTabs,Oe as __namedExportsOrder,Be as default};
