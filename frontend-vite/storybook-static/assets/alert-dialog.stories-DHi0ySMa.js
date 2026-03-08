import{j as e}from"./jsx-runtime-Z5uAzocK.js";import{r as l}from"./index-pP6CS22B.js";import{c as se,a as ce}from"./index-BYUIXDsI.js";import{u as H}from"./index-x8NkB57A.js";import{R as de,T as ge,c as M,P as pe,W as ue,C as me,b as Ae,D as De,a as L,O as fe}from"./index-CFn2u_c2.js";import{c as s}from"./utils-BLSKlp9E.js";import{b as Y,B as C}from"./button-Cophts_w.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-Bvak3XBe.js";import"./index-Czt2WBNw.js";import"./index-xdNYasdH.js";import"./index-Ck0Qw0kh.js";import"./index-F0R8IyTw.js";import"./index-DSMx10ar.js";import"./index-2Uu5snjE.js";import"./index-CbcPFHB_.js";import"./index-cAPKYzjE.js";import"./index-1evVQkiP.js";var xe=Symbol("radix.slottable");function ve(o){const t=({children:r})=>e.jsx(e.Fragment,{children:r});return t.displayName=`${o}.Slottable`,t.__radixId=xe,t}var k="AlertDialog",[he]=ce(k,[M]),n=M(),z=o=>{const{__scopeAlertDialog:t,...r}=o,a=n(t);return e.jsx(de,{...a,...r,modal:!0})};z.displayName=k;var ye="AlertDialogTrigger",G=l.forwardRef((o,t)=>{const{__scopeAlertDialog:r,...a}=o,i=n(r);return e.jsx(ge,{...i,...a,ref:t})});G.displayName=ye;var be="AlertDialogPortal",W=o=>{const{__scopeAlertDialog:t,...r}=o,a=n(t);return e.jsx(pe,{...a,...r})};W.displayName=be;var je="AlertDialogOverlay",V=l.forwardRef((o,t)=>{const{__scopeAlertDialog:r,...a}=o,i=n(r);return e.jsx(fe,{...i,...a,ref:t})});V.displayName=je;var c="AlertDialogContent",[Ce,Ne]=he(c),_e=ve("AlertDialogContent"),q=l.forwardRef((o,t)=>{const{__scopeAlertDialog:r,children:a,...i}=o,j=n(r),x=l.useRef(null),ne=H(t,x),T=l.useRef(null);return e.jsx(ue,{contentName:c,titleName:U,docsSlug:"alert-dialog",children:e.jsx(Ce,{scope:r,cancelRef:T,children:e.jsxs(me,{role:"alertdialog",...j,...i,ref:ne,onOpenAutoFocus:se(i.onOpenAutoFocus,d=>{var S;d.preventDefault(),(S=T.current)==null||S.focus({preventScroll:!0})}),onPointerDownOutside:d=>d.preventDefault(),onInteractOutside:d=>d.preventDefault(),children:[e.jsx(_e,{children:a}),e.jsx(Se,{contentRef:x})]})})})});q.displayName=c;var U="AlertDialogTitle",J=l.forwardRef((o,t)=>{const{__scopeAlertDialog:r,...a}=o,i=n(r);return e.jsx(Ae,{...i,...a,ref:t})});J.displayName=U;var K="AlertDialogDescription",Q=l.forwardRef((o,t)=>{const{__scopeAlertDialog:r,...a}=o,i=n(r);return e.jsx(De,{...i,...a,ref:t})});Q.displayName=K;var Te="AlertDialogAction",X=l.forwardRef((o,t)=>{const{__scopeAlertDialog:r,...a}=o,i=n(r);return e.jsx(L,{...i,...a,ref:t})});X.displayName=Te;var Z="AlertDialogCancel",ee=l.forwardRef((o,t)=>{const{__scopeAlertDialog:r,...a}=o,{cancelRef:i}=Ne(Z,r),j=n(r),x=H(t,i);return e.jsx(L,{...j,...a,ref:x})});ee.displayName=Z;var Se=({contentRef:o})=>{const t=`\`${c}\` requires a description for the component to be accessible for screen reader users.

You can add a description to the \`${c}\` by passing a \`${K}\` component as a child, which also benefits sighted users by adding visible context to the dialog.

Alternatively, you can use your own component as a description by assigning it an \`id\` and passing the same value to the \`aria-describedby\` prop in \`${c}\`. If the description is confusing or duplicative for sighted users, you can use the \`@radix-ui/react-visually-hidden\` primitive as a wrapper around your description component.

For more information, see https://radix-ui.com/primitives/docs/components/alert-dialog`;return l.useEffect(()=>{var a;document.getElementById((a=o.current)==null?void 0:a.getAttribute("aria-describedby"))||console.warn(t)},[t,o]),null},we=z,Re=G,Ee=W,te=V,oe=q,re=X,ae=ee,le=J,ie=Q;const b=we,N=Re,Pe=Ee,_=l.forwardRef(({className:o,...t},r)=>e.jsx(te,{className:s("fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",o),...t,ref:r}));_.displayName=te.displayName;const g=l.forwardRef(({className:o,...t},r)=>e.jsxs(Pe,{children:[e.jsx(_,{}),e.jsx(oe,{ref:r,className:s("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",o),...t})]}));g.displayName=oe.displayName;const p=({className:o,...t})=>e.jsx("div",{className:s("flex flex-col space-y-2 text-center sm:text-left",o),...t});p.displayName="AlertDialogHeader";const u=({className:o,...t})=>e.jsx("div",{className:s("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",o),...t});u.displayName="AlertDialogFooter";const m=l.forwardRef(({className:o,...t},r)=>e.jsx(le,{ref:r,className:s("text-lg font-semibold",o),...t}));m.displayName=le.displayName;const A=l.forwardRef(({className:o,...t},r)=>e.jsx(ie,{ref:r,className:s("text-sm text-muted-foreground",o),...t}));A.displayName=ie.displayName;const D=l.forwardRef(({className:o,...t},r)=>e.jsx(re,{ref:r,className:s(Y(),o),...t}));D.displayName=re.displayName;const f=l.forwardRef(({className:o,...t},r)=>e.jsx(ae,{ref:r,className:s(Y({variant:"outline"}),"mt-2 sm:mt-0",o),...t}));f.displayName=ae.displayName;_.__docgenInfo={description:"",methods:[]};g.__docgenInfo={description:"",methods:[]};p.__docgenInfo={description:"",methods:[],displayName:"AlertDialogHeader"};u.__docgenInfo={description:"",methods:[],displayName:"AlertDialogFooter"};m.__docgenInfo={description:"",methods:[]};A.__docgenInfo={description:"",methods:[]};D.__docgenInfo={description:"",methods:[]};f.__docgenInfo={description:"",methods:[]};const Qe={title:"UI/AlertDialog",component:b,tags:["autodocs"]},v={render:()=>e.jsxs(b,{children:[e.jsx(N,{asChild:!0,children:e.jsx(C,{variant:"outline",children:"Open Alert Dialog"})}),e.jsxs(g,{children:[e.jsxs(p,{children:[e.jsx(m,{children:"Are you absolutely sure?"}),e.jsx(A,{children:"This action cannot be undone. This will permanently delete your account and remove your data from our servers."})]}),e.jsxs(u,{children:[e.jsx(f,{children:"Cancel"}),e.jsx(D,{children:"Continue"})]})]})]})},h={render:()=>e.jsxs(b,{children:[e.jsx(N,{asChild:!0,children:e.jsx(C,{variant:"destructive",children:"Delete Account"})}),e.jsxs(g,{children:[e.jsxs(p,{children:[e.jsx(m,{children:"Delete Account"}),e.jsx(A,{children:"Are you sure you want to delete your account? All of your data will be permanently removed. This action cannot be undone."})]}),e.jsxs(u,{children:[e.jsx(f,{children:"Cancel"}),e.jsx(D,{className:"bg-destructive text-destructive-foreground hover:bg-destructive/90",children:"Delete"})]})]})]})},y={render:()=>e.jsxs(b,{children:[e.jsx(N,{asChild:!0,children:e.jsx(C,{children:"Submit Application"})}),e.jsxs(g,{children:[e.jsxs(p,{children:[e.jsx(m,{children:"Confirm Submission"}),e.jsx(A,{children:"You are about to submit your application. Please make sure all information is correct before proceeding. You will not be able to edit your application after submission."})]}),e.jsxs(u,{children:[e.jsx(f,{children:"Review Again"}),e.jsx(D,{children:"Submit"})]})]})]})};var w,R,E;v.parameters={...v.parameters,docs:{...(w=v.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Open Alert Dialog</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your account and remove your
            data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
}`,...(E=(R=v.parameters)==null?void 0:R.docs)==null?void 0:E.source}}};var P,I,O;h.parameters={...h.parameters,docs:{...(P=h.parameters)==null?void 0:P.docs,source:{originalSource:`{
  render: () => <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Account</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete your account? All of your data will be permanently
            removed. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
}`,...(O=(I=h.parameters)==null?void 0:I.docs)==null?void 0:O.source}}};var F,$,B;y.parameters={...y.parameters,docs:{...(F=y.parameters)==null?void 0:F.docs,source:{originalSource:`{
  render: () => <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Submit Application</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to submit your application. Please make sure all information is correct
            before proceeding. You will not be able to edit your application after submission.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Review Again</AlertDialogCancel>
          <AlertDialogAction>Submit</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
}`,...(B=($=y.parameters)==null?void 0:$.docs)==null?void 0:B.source}}};const Xe=["Default","DeleteConfirmation","ConfirmSubmission"];export{y as ConfirmSubmission,v as Default,h as DeleteConfirmation,Xe as __namedExportsOrder,Qe as default};
