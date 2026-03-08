import{j as e}from"./jsx-runtime-Z5uAzocK.js";import{r as i}from"./index-pP6CS22B.js";import{P as J,c as j,a as ae}from"./index-BYUIXDsI.js";import{c as ie,u as U}from"./index-x8NkB57A.js";import{P as le,D as ce}from"./index-F0R8IyTw.js";import{h as de,R as pe,u as ue,F as me}from"./index-CAIBKOjf.js";import{u as fe}from"./index-Czt2WBNw.js";import{R as ve,A as z,c as G,C as he,a as ge}from"./index-BUQy0IMf.js";import{P as q}from"./index-CbcPFHB_.js";import{u as xe}from"./index-Ck0Qw0kh.js";import{c as Pe}from"./utils-BLSKlp9E.js";import{B as g}from"./button-Cophts_w.js";import{I as _}from"./input-DRLCrBPJ.js";import{L as E}from"./label-BhlulYsX.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-Bvak3XBe.js";import"./index-DSMx10ar.js";import"./index-xdNYasdH.js";import"./index-n-b12q8t.js";import"./index-cAPKYzjE.js";import"./index-1evVQkiP.js";function Ce(o){const r=je(o),n=i.forwardRef((s,t)=>{const{children:a,...l}=s,c=i.Children.toArray(a),d=c.find(Re);if(d){const p=d.props.children,P=c.map(v=>v===d?i.Children.count(p)>1?i.Children.only(null):i.isValidElement(p)?p.props.children:null:v);return e.jsx(r,{...l,ref:t,children:i.isValidElement(p)?i.cloneElement(p,void 0,P):null})}return e.jsx(r,{...l,ref:t,children:a})});return n.displayName=`${o}.Slot`,n}function je(o){const r=i.forwardRef((n,s)=>{const{children:t,...a}=n;if(i.isValidElement(t)){const l=we(t),c=be(a,t.props);return t.type!==i.Fragment&&(c.ref=s?ie(s,l):l),i.cloneElement(t,c)}return i.Children.count(t)>1?i.Children.only(null):null});return r.displayName=`${o}.SlotClone`,r}var Ne=Symbol("radix.slottable");function Re(o){return i.isValidElement(o)&&typeof o.type=="function"&&"__radixId"in o.type&&o.type.__radixId===Ne}function be(o,r){const n={...r};for(const s in r){const t=o[s],a=r[s];/^on[A-Z]/.test(s)?t&&a?n[s]=(...c)=>{const d=a(...c);return t(...c),d}:t&&(n[s]=t):s==="style"?n[s]={...t,...a}:s==="className"&&(n[s]=[t,a].filter(Boolean).join(" "))}return{...o,...n}}function we(o){var s,t;let r=(s=Object.getOwnPropertyDescriptor(o.props,"ref"))==null?void 0:s.get,n=r&&"isReactWarning"in r&&r.isReactWarning;return n?o.ref:(r=(t=Object.getOwnPropertyDescriptor(o,"ref"))==null?void 0:t.get,n=r&&"isReactWarning"in r&&r.isReactWarning,n?o.props.ref:o.props.ref||o.ref)}var O="Popover",[K]=ae(O,[G]),N=G(),[ye,f]=K(O),Z=o=>{const{__scopePopover:r,children:n,open:s,defaultOpen:t,onOpenChange:a,modal:l=!1}=o,c=N(r),d=i.useRef(null),[p,P]=i.useState(!1),[v,h]=xe({prop:s,defaultProp:t??!1,onChange:a,caller:O});return e.jsx(ve,{...c,children:e.jsx(ye,{scope:r,contentId:fe(),triggerRef:d,open:v,onOpenChange:h,onOpenToggle:i.useCallback(()=>h(A=>!A),[h]),hasCustomAnchor:p,onCustomAnchorAdd:i.useCallback(()=>P(!0),[]),onCustomAnchorRemove:i.useCallback(()=>P(!1),[]),modal:l,children:n})})};Z.displayName=O;var Q="PopoverAnchor",Oe=i.forwardRef((o,r)=>{const{__scopePopover:n,...s}=o,t=f(Q,n),a=N(n),{onCustomAnchorAdd:l,onCustomAnchorRemove:c}=t;return i.useEffect(()=>(l(),()=>c()),[l,c]),e.jsx(z,{...a,...s,ref:r})});Oe.displayName=Q;var X="PopoverTrigger",Y=i.forwardRef((o,r)=>{const{__scopePopover:n,...s}=o,t=f(X,n),a=N(n),l=U(r,t.triggerRef),c=e.jsx(J.button,{type:"button","aria-haspopup":"dialog","aria-expanded":t.open,"aria-controls":t.contentId,"data-state":ne(t.open),...s,ref:l,onClick:j(o.onClick,t.onOpenToggle)});return t.hasCustomAnchor?c:e.jsx(z,{asChild:!0,...a,children:c})});Y.displayName=X;var S="PopoverPortal",[Ae,_e]=K(S,{forceMount:void 0}),ee=o=>{const{__scopePopover:r,forceMount:n,children:s,container:t}=o,a=f(S,r);return e.jsx(Ae,{scope:r,forceMount:n,children:e.jsx(q,{present:n||a.open,children:e.jsx(le,{asChild:!0,container:t,children:s})})})};ee.displayName=S;var C="PopoverContent",oe=i.forwardRef((o,r)=>{const n=_e(C,o.__scopePopover),{forceMount:s=n.forceMount,...t}=o,a=f(C,o.__scopePopover);return e.jsx(q,{present:s||a.open,children:a.modal?e.jsx(Se,{...t,ref:r}):e.jsx(Te,{...t,ref:r})})});oe.displayName=C;var Ee=Ce("PopoverContent.RemoveScroll"),Se=i.forwardRef((o,r)=>{const n=f(C,o.__scopePopover),s=i.useRef(null),t=U(r,s),a=i.useRef(!1);return i.useEffect(()=>{const l=s.current;if(l)return de(l)},[]),e.jsx(pe,{as:Ee,allowPinchZoom:!0,children:e.jsx(te,{...o,ref:t,trapFocus:n.open,disableOutsidePointerEvents:!0,onCloseAutoFocus:j(o.onCloseAutoFocus,l=>{var c;l.preventDefault(),a.current||(c=n.triggerRef.current)==null||c.focus()}),onPointerDownOutside:j(o.onPointerDownOutside,l=>{const c=l.detail.originalEvent,d=c.button===0&&c.ctrlKey===!0,p=c.button===2||d;a.current=p},{checkForDefaultPrevented:!1}),onFocusOutside:j(o.onFocusOutside,l=>l.preventDefault(),{checkForDefaultPrevented:!1})})})}),Te=i.forwardRef((o,r)=>{const n=f(C,o.__scopePopover),s=i.useRef(!1),t=i.useRef(!1);return e.jsx(te,{...o,ref:r,trapFocus:!1,disableOutsidePointerEvents:!1,onCloseAutoFocus:a=>{var l,c;(l=o.onCloseAutoFocus)==null||l.call(o,a),a.defaultPrevented||(s.current||(c=n.triggerRef.current)==null||c.focus(),a.preventDefault()),s.current=!1,t.current=!1},onInteractOutside:a=>{var d,p;(d=o.onInteractOutside)==null||d.call(o,a),a.defaultPrevented||(s.current=!0,a.detail.originalEvent.type==="pointerdown"&&(t.current=!0));const l=a.target;((p=n.triggerRef.current)==null?void 0:p.contains(l))&&a.preventDefault(),a.detail.originalEvent.type==="focusin"&&t.current&&a.preventDefault()}})}),te=i.forwardRef((o,r)=>{const{__scopePopover:n,trapFocus:s,onOpenAutoFocus:t,onCloseAutoFocus:a,disableOutsidePointerEvents:l,onEscapeKeyDown:c,onPointerDownOutside:d,onFocusOutside:p,onInteractOutside:P,...v}=o,h=f(C,n),A=N(n);return ue(),e.jsx(me,{asChild:!0,loop:!0,trapped:s,onMountAutoFocus:t,onUnmountAutoFocus:a,children:e.jsx(ce,{asChild:!0,disableOutsidePointerEvents:l,onInteractOutside:P,onEscapeKeyDown:c,onPointerDownOutside:d,onFocusOutside:p,onDismiss:()=>h.onOpenChange(!1),children:e.jsx(he,{"data-state":ne(h.open),role:"dialog",id:h.contentId,...A,...v,ref:r,style:{...v.style,"--radix-popover-content-transform-origin":"var(--radix-popper-transform-origin)","--radix-popover-content-available-width":"var(--radix-popper-available-width)","--radix-popover-content-available-height":"var(--radix-popper-available-height)","--radix-popover-trigger-width":"var(--radix-popper-anchor-width)","--radix-popover-trigger-height":"var(--radix-popper-anchor-height)"}})})})}),re="PopoverClose",De=i.forwardRef((o,r)=>{const{__scopePopover:n,...s}=o,t=f(re,n);return e.jsx(J.button,{type:"button",...s,ref:r,onClick:j(o.onClick,()=>t.onOpenChange(!1))})});De.displayName=re;var Fe="PopoverArrow",Ie=i.forwardRef((o,r)=>{const{__scopePopover:n,...s}=o,t=N(n);return e.jsx(ge,{...t,...s,ref:r})});Ie.displayName=Fe;function ne(o){return o?"open":"closed"}var Be=Z,Ve=Y,Le=ee,se=oe;const m=Be,x=Ve,u=i.forwardRef(({className:o,align:r="center",sideOffset:n=4,...s},t)=>e.jsx(Le,{children:e.jsx(se,{ref:t,align:r,sideOffset:n,className:Pe("z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",o),...s})}));u.displayName=se.displayName;u.__docgenInfo={description:"",methods:[],props:{align:{defaultValue:{value:"'center'",computed:!1},required:!1},sideOffset:{defaultValue:{value:"4",computed:!1},required:!1}}};const ao={title:"UI/Popover",component:m,tags:["autodocs"]},R={render:()=>e.jsxs(m,{children:[e.jsx(x,{asChild:!0,children:e.jsx(g,{variant:"outline",children:"Open Popover"})}),e.jsx(u,{className:"w-80",children:e.jsxs("div",{className:"grid gap-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx("h4",{className:"font-medium leading-none",children:"Dimensions"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Set the dimensions for the layer."})]}),e.jsxs("div",{className:"grid gap-2",children:[e.jsxs("div",{className:"grid grid-cols-3 items-center gap-4",children:[e.jsx(E,{htmlFor:"width",children:"Width"}),e.jsx(_,{id:"width",defaultValue:"100%",className:"col-span-2 h-8"})]}),e.jsxs("div",{className:"grid grid-cols-3 items-center gap-4",children:[e.jsx(E,{htmlFor:"maxWidth",children:"Max. width"}),e.jsx(_,{id:"maxWidth",defaultValue:"300px",className:"col-span-2 h-8"})]}),e.jsxs("div",{className:"grid grid-cols-3 items-center gap-4",children:[e.jsx(E,{htmlFor:"height",children:"Height"}),e.jsx(_,{id:"height",defaultValue:"25px",className:"col-span-2 h-8"})]})]})]})})]})},b={render:()=>e.jsxs(m,{children:[e.jsx(x,{asChild:!0,children:e.jsx(g,{variant:"outline",children:"Info"})}),e.jsx(u,{children:e.jsx("p",{className:"text-sm",children:"This is a simple popover with some text content."})})]})},w={render:()=>e.jsxs("div",{className:"flex items-center justify-center gap-4 p-20",children:[e.jsxs(m,{children:[e.jsx(x,{asChild:!0,children:e.jsx(g,{variant:"outline",children:"Top"})}),e.jsx(u,{side:"top",children:e.jsx("p",{className:"text-sm",children:"Popover on top"})})]}),e.jsxs(m,{children:[e.jsx(x,{asChild:!0,children:e.jsx(g,{variant:"outline",children:"Right"})}),e.jsx(u,{side:"right",children:e.jsx("p",{className:"text-sm",children:"Popover on right"})})]}),e.jsxs(m,{children:[e.jsx(x,{asChild:!0,children:e.jsx(g,{variant:"outline",children:"Bottom"})}),e.jsx(u,{side:"bottom",children:e.jsx("p",{className:"text-sm",children:"Popover on bottom"})})]}),e.jsxs(m,{children:[e.jsx(x,{asChild:!0,children:e.jsx(g,{variant:"outline",children:"Left"})}),e.jsx(u,{side:"left",children:e.jsx("p",{className:"text-sm",children:"Popover on left"})})]})]})},y={render:()=>e.jsxs(m,{children:[e.jsx(x,{asChild:!0,children:e.jsx(g,{variant:"outline",children:"View Profile"})}),e.jsx(u,{className:"w-80",children:e.jsxs("div",{className:"flex gap-4",children:[e.jsx("div",{className:"flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-semibold",children:"JD"}),e.jsxs("div",{className:"space-y-1",children:[e.jsx("h4",{className:"font-semibold",children:"John Doe"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"john.doe@example.com"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Product Designer"})]})]})})]})};var T,D,F;R.parameters={...R.parameters,docs:{...(T=R.parameters)==null?void 0:T.docs,source:{originalSource:`{
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
}`,...(F=(D=R.parameters)==null?void 0:D.docs)==null?void 0:F.source}}};var I,B,V;b.parameters={...b.parameters,docs:{...(I=b.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: () => <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Info</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-sm">This is a simple popover with some text content.</p>
      </PopoverContent>
    </Popover>
}`,...(V=(B=b.parameters)==null?void 0:B.docs)==null?void 0:V.source}}};var L,M,k;w.parameters={...w.parameters,docs:{...(L=w.parameters)==null?void 0:L.docs,source:{originalSource:`{
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
}`,...(k=(M=w.parameters)==null?void 0:M.docs)==null?void 0:k.source}}};var W,H,$;y.parameters={...y.parameters,docs:{...(W=y.parameters)==null?void 0:W.docs,source:{originalSource:`{
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
}`,...($=(H=y.parameters)==null?void 0:H.docs)==null?void 0:$.source}}};const io=["Default","SimpleContent","Positioning","UserProfile"];export{R as Default,w as Positioning,b as SimpleContent,y as UserProfile,io as __namedExportsOrder,ao as default};
