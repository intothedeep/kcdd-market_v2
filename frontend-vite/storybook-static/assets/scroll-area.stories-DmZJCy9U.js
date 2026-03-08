import{j as e}from"./jsx-runtime-Z5uAzocK.js";import{S as i,a as f}from"./scroll-area-Ba87ffCn.js";import{S as q}from"./separator-DlaycN7c.js";import"./index-pP6CS22B.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-BYUIXDsI.js";import"./index-Bvak3XBe.js";import"./index-x8NkB57A.js";import"./index-CbcPFHB_.js";import"./index-xdNYasdH.js";import"./index-DSMx10ar.js";import"./index-C7OyeuXp.js";import"./index-BdQq_4o_.js";import"./utils-BLSKlp9E.js";import"./index-cAPKYzjE.js";const H={title:"UI/ScrollArea",component:i,tags:["autodocs"]},v=Array.from({length:50}).map((t,g)=>`Tag ${g+1}`),a={render:()=>e.jsx(i,{className:"h-72 w-48 rounded-md border",children:e.jsxs("div",{className:"p-4",children:[e.jsx("h4",{className:"mb-4 text-sm font-medium leading-none",children:"Tags"}),v.map(t=>e.jsxs("div",{children:[e.jsx("div",{className:"text-sm",children:t}),e.jsx(q,{className:"my-2"})]},t))]})})},h=[{title:"Artwork 1",artist:"Artist A"},{title:"Artwork 2",artist:"Artist B"},{title:"Artwork 3",artist:"Artist C"},{title:"Artwork 4",artist:"Artist D"},{title:"Artwork 5",artist:"Artist E"},{title:"Artwork 6",artist:"Artist F"},{title:"Artwork 7",artist:"Artist G"},{title:"Artwork 8",artist:"Artist H"}],r={render:()=>e.jsxs(i,{className:"w-96 whitespace-nowrap rounded-md border",children:[e.jsx("div",{className:"flex w-max space-x-4 p-4",children:h.map(t=>e.jsxs("figure",{className:"shrink-0",children:[e.jsx("div",{className:"overflow-hidden rounded-md",children:e.jsx("div",{className:"flex h-40 w-32 items-center justify-center bg-muted",children:e.jsx("span",{className:"text-xs text-muted-foreground",children:t.title})})}),e.jsx("figcaption",{className:"pt-2 text-xs text-muted-foreground",children:e.jsx("span",{className:"font-semibold text-foreground",children:t.artist})})]},t.title))}),e.jsx(f,{orientation:"horizontal"})]})},s={render:()=>e.jsxs(i,{className:"h-[300px] w-[350px] rounded-md border p-4",children:[e.jsx("h4",{className:"mb-4 text-lg font-semibold",children:"Terms of Service"}),e.jsx("p",{className:"mb-4 text-sm text-muted-foreground",children:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."}),e.jsx("p",{className:"mb-4 text-sm text-muted-foreground",children:"Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."}),e.jsx("p",{className:"mb-4 text-sm text-muted-foreground",children:"Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo."}),e.jsx("p",{className:"mb-4 text-sm text-muted-foreground",children:"Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt."}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem."})]})};var o,n,m;a.parameters={...a.parameters,docs:{...(o=a.parameters)==null?void 0:o.docs,source:{originalSource:`{
  render: () => <ScrollArea className="h-72 w-48 rounded-md border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
        {tags.map(tag => <div key={tag}>
            <div className="text-sm">{tag}</div>
            <Separator className="my-2" />
          </div>)}
      </div>
    </ScrollArea>
}`,...(m=(n=a.parameters)==null?void 0:n.docs)==null?void 0:m.source}}};var u,d,l;r.parameters={...r.parameters,docs:{...(u=r.parameters)==null?void 0:u.docs,source:{originalSource:`{
  render: () => <ScrollArea className="w-96 whitespace-nowrap rounded-md border">
      <div className="flex w-max space-x-4 p-4">
        {artworks.map(artwork => <figure key={artwork.title} className="shrink-0">
            <div className="overflow-hidden rounded-md">
              <div className="flex h-40 w-32 items-center justify-center bg-muted">
                <span className="text-xs text-muted-foreground">{artwork.title}</span>
              </div>
            </div>
            <figcaption className="pt-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{artwork.artist}</span>
            </figcaption>
          </figure>)}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
}`,...(l=(d=r.parameters)==null?void 0:d.docs)==null?void 0:l.source}}};var c,p,x;s.parameters={...s.parameters,docs:{...(c=s.parameters)==null?void 0:c.docs,source:{originalSource:`{
  render: () => <ScrollArea className="h-[300px] w-[350px] rounded-md border p-4">
      <h4 className="mb-4 text-lg font-semibold">Terms of Service</h4>
      <p className="mb-4 text-sm text-muted-foreground">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris nisi ut aliquip ex ea commodo consequat.
      </p>
      <p className="mb-4 text-sm text-muted-foreground">
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
        pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
        mollit anim id est laborum.
      </p>
      <p className="mb-4 text-sm text-muted-foreground">
        Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
        laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi
        architecto beatae vitae dicta sunt explicabo.
      </p>
      <p className="mb-4 text-sm text-muted-foreground">
        Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
        consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
      </p>
      <p className="text-sm text-muted-foreground">
        Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci
        velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam
        quaerat voluptatem.
      </p>
    </ScrollArea>
}`,...(x=(p=s.parameters)==null?void 0:p.docs)==null?void 0:x.source}}};const U=["Vertical","Horizontal","LongContent"];export{r as Horizontal,s as LongContent,a as Vertical,U as __namedExportsOrder,H as default};
