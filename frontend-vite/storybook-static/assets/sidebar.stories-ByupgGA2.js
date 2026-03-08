import{j as e}from"./jsx-runtime-Z5uAzocK.js";import{c as l}from"./utils-BLSKlp9E.js";import{H as g,S as f,U as w,B as y}from"./users-Dqh6tYp2.js";import{c as v}from"./createLucideIcon-DNXvdQsS.js";import{S as R}from"./settings-suG9ViM6.js";import{L as H}from"./log-out-Diylg8C2.js";import"./index-pP6CS22B.js";import"./_commonjsHelpers-Cpj98o6Y.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=v("FileText",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const O=v("HelpCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);function n({className:r,children:s,...i}){return e.jsx("div",{className:l("flex h-full w-64 flex-col bg-[#fafafa] p-2",r),...i,children:s})}function t({className:r,children:s,label:i,...m}){return e.jsxs("div",{className:l("flex flex-col gap-1 pb-2",r),...m,children:[i&&e.jsx("div",{className:"flex h-8 items-center px-2 opacity-70",children:e.jsx("span",{className:"text-xs font-medium text-foreground",children:i})}),s]})}function a({className:r,icon:s,active:i,children:m,...k}){return e.jsxs("button",{className:l("flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-sm transition-colors",i?"bg-[#1b5858] text-white":"text-foreground hover:bg-muted",r),...k,children:[s&&e.jsx("span",{className:"flex size-4 items-center justify-center",children:s}),e.jsx("span",{className:"truncate",children:m})]})}function G({className:r,children:s,...i}){return e.jsx("div",{className:l("mt-auto pt-2",r),...i,children:s})}n.__docgenInfo={description:"",methods:[],displayName:"Sidebar",props:{children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};t.__docgenInfo={description:"",methods:[],displayName:"SidebarGroup",props:{children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},label:{required:!1,tsType:{name:"string"},description:""}}};a.__docgenInfo={description:"",methods:[],displayName:"SidebarItem",props:{icon:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},active:{required:!1,tsType:{name:"boolean"},description:""},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};G.__docgenInfo={description:"",methods:[],displayName:"SidebarFooter",props:{children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};const U={title:"UI/Sidebar",component:n,tags:["autodocs"],decorators:[r=>e.jsx("div",{className:"h-[500px]",children:e.jsx(r,{})})]},c={render:()=>e.jsxs(n,{children:[e.jsxs(t,{label:"Main",children:[e.jsx(a,{icon:e.jsx(g,{className:"h-4 w-4"}),active:!0,children:"Dashboard"}),e.jsx(a,{icon:e.jsx(f,{className:"h-4 w-4"}),children:"Marketplace"}),e.jsx(a,{icon:e.jsx(w,{className:"h-4 w-4"}),children:"Organizations"}),e.jsx(a,{icon:e.jsx(M,{className:"h-4 w-4"}),children:"Campaigns"}),e.jsx(a,{icon:e.jsx(y,{className:"h-4 w-4"}),children:"Analytics"})]}),e.jsx(G,{children:e.jsxs(t,{children:[e.jsx(a,{icon:e.jsx(O,{className:"h-4 w-4"}),children:"Help"}),e.jsx(a,{icon:e.jsx(R,{className:"h-4 w-4"}),children:"Settings"}),e.jsx(a,{icon:e.jsx(H,{className:"h-4 w-4"}),children:"Sign Out"})]})})]})},o={render:()=>e.jsx(n,{children:e.jsxs(t,{label:"Navigation",children:[e.jsx(a,{active:!0,children:"Dashboard"}),e.jsx(a,{children:"Marketplace"}),e.jsx(a,{children:"Organizations"}),e.jsx(a,{children:"Campaigns"})]})})},d={render:()=>e.jsxs(n,{children:[e.jsxs(t,{label:"Overview",children:[e.jsx(a,{icon:e.jsx(g,{className:"h-4 w-4"}),active:!0,children:"Dashboard"}),e.jsx(a,{icon:e.jsx(y,{className:"h-4 w-4"}),children:"Analytics"})]}),e.jsxs(t,{label:"Management",children:[e.jsx(a,{icon:e.jsx(f,{className:"h-4 w-4"}),children:"Marketplace"}),e.jsx(a,{icon:e.jsx(w,{className:"h-4 w-4"}),children:"Organizations"}),e.jsx(a,{icon:e.jsx(M,{className:"h-4 w-4"}),children:"Campaigns"})]}),e.jsx(t,{label:"Account",children:e.jsx(a,{icon:e.jsx(R,{className:"h-4 w-4"}),children:"Settings"})})]})};var p,h,b;c.parameters={...c.parameters,docs:{...(p=c.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <Sidebar>
      <SidebarGroup label="Main">
        <SidebarItem icon={<Home className="h-4 w-4" />} active>
          Dashboard
        </SidebarItem>
        <SidebarItem icon={<Store className="h-4 w-4" />}>Marketplace</SidebarItem>
        <SidebarItem icon={<Users className="h-4 w-4" />}>Organizations</SidebarItem>
        <SidebarItem icon={<FileText className="h-4 w-4" />}>Campaigns</SidebarItem>
        <SidebarItem icon={<BarChart3 className="h-4 w-4" />}>Analytics</SidebarItem>
      </SidebarGroup>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarItem icon={<HelpCircle className="h-4 w-4" />}>Help</SidebarItem>
          <SidebarItem icon={<Settings className="h-4 w-4" />}>Settings</SidebarItem>
          <SidebarItem icon={<LogOut className="h-4 w-4" />}>Sign Out</SidebarItem>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
}`,...(b=(h=c.parameters)==null?void 0:h.docs)==null?void 0:b.source}}};var S,x,u;o.parameters={...o.parameters,docs:{...(S=o.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: () => <Sidebar>
      <SidebarGroup label="Navigation">
        <SidebarItem active>Dashboard</SidebarItem>
        <SidebarItem>Marketplace</SidebarItem>
        <SidebarItem>Organizations</SidebarItem>
        <SidebarItem>Campaigns</SidebarItem>
      </SidebarGroup>
    </Sidebar>
}`,...(u=(x=o.parameters)==null?void 0:x.docs)==null?void 0:u.source}}};var j,N,I;d.parameters={...d.parameters,docs:{...(j=d.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => <Sidebar>
      <SidebarGroup label="Overview">
        <SidebarItem icon={<Home className="h-4 w-4" />} active>
          Dashboard
        </SidebarItem>
        <SidebarItem icon={<BarChart3 className="h-4 w-4" />}>Analytics</SidebarItem>
      </SidebarGroup>
      <SidebarGroup label="Management">
        <SidebarItem icon={<Store className="h-4 w-4" />}>Marketplace</SidebarItem>
        <SidebarItem icon={<Users className="h-4 w-4" />}>Organizations</SidebarItem>
        <SidebarItem icon={<FileText className="h-4 w-4" />}>Campaigns</SidebarItem>
      </SidebarGroup>
      <SidebarGroup label="Account">
        <SidebarItem icon={<Settings className="h-4 w-4" />}>Settings</SidebarItem>
      </SidebarGroup>
    </Sidebar>
}`,...(I=(N=d.parameters)==null?void 0:N.docs)==null?void 0:I.source}}};const B=["Default","WithoutIcons","MultipleGroups"];export{c as Default,d as MultipleGroups,o as WithoutIcons,B as __namedExportsOrder,U as default};
