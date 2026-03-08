import{j as e}from"./jsx-runtime-Z5uAzocK.js";import{r}from"./index-pP6CS22B.js";import{c as d}from"./utils-BLSKlp9E.js";import{B as j}from"./badge-C8wEKfuW.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-1evVQkiP.js";const i=r.forwardRef(({className:a,...n},s)=>e.jsx("div",{className:"relative w-full overflow-auto",children:e.jsx("table",{ref:s,className:d("w-full caption-bottom text-sm",a),...n})}));i.displayName="Table";const c=r.forwardRef(({className:a,...n},s)=>e.jsx("thead",{ref:s,className:d("bg-[#f5f5f5] [&_tr]:border-b",a),...n}));c.displayName="TableHeader";const m=r.forwardRef(({className:a,...n},s)=>e.jsx("tbody",{ref:s,className:d("[&_tr:last-child]:border-0",a),...n}));m.displayName="TableBody";const p=r.forwardRef(({className:a,...n},s)=>e.jsx("tfoot",{ref:s,className:d("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",a),...n}));p.displayName="TableFooter";const t=r.forwardRef(({className:a,...n},s)=>e.jsx("tr",{ref:s,className:d("border-b border-[#e5e5e5] transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",a),...n}));t.displayName="TableRow";const o=r.forwardRef(({className:a,...n},s)=>e.jsx("th",{ref:s,className:d("h-10 px-2 text-left align-middle font-medium text-[#0a0a0a] [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",a),...n}));o.displayName="TableHead";const l=r.forwardRef(({className:a,...n},s)=>e.jsx("td",{ref:s,className:d("p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",a),...n}));l.displayName="TableCell";const u=r.forwardRef(({className:a,...n},s)=>e.jsx("caption",{ref:s,className:d("mt-4 text-sm text-muted-foreground",a),...n}));u.displayName="TableCaption";i.__docgenInfo={description:"",methods:[],displayName:"Table"};c.__docgenInfo={description:"",methods:[],displayName:"TableHeader"};m.__docgenInfo={description:"",methods:[],displayName:"TableBody"};p.__docgenInfo={description:"",methods:[],displayName:"TableFooter"};o.__docgenInfo={description:"",methods:[],displayName:"TableHead"};t.__docgenInfo={description:"",methods:[],displayName:"TableRow"};l.__docgenInfo={description:"",methods:[],displayName:"TableCell"};u.__docgenInfo={description:"",methods:[],displayName:"TableCaption"};const E={title:"UI/Table",component:i,tags:["autodocs"]},I=[{invoice:"INV001",status:"Paid",method:"Credit Card",amount:"$250.00"},{invoice:"INV002",status:"Pending",method:"PayPal",amount:"$150.00"},{invoice:"INV003",status:"Unpaid",method:"Bank Transfer",amount:"$350.00"},{invoice:"INV004",status:"Paid",method:"Credit Card",amount:"$450.00"},{invoice:"INV005",status:"Paid",method:"PayPal",amount:"$550.00"}],b={render:()=>e.jsxs(i,{children:[e.jsx(u,{children:"A list of your recent invoices."}),e.jsx(c,{children:e.jsxs(t,{children:[e.jsx(o,{className:"w-[100px]",children:"Invoice"}),e.jsx(o,{children:"Status"}),e.jsx(o,{children:"Method"}),e.jsx(o,{className:"text-right",children:"Amount"})]})}),e.jsx(m,{children:I.map(a=>e.jsxs(t,{children:[e.jsx(l,{className:"font-medium",children:a.invoice}),e.jsx(l,{children:a.status}),e.jsx(l,{children:a.method}),e.jsx(l,{className:"text-right",children:a.amount})]},a.invoice))})]})},T={render:()=>e.jsxs(i,{children:[e.jsx(c,{children:e.jsxs(t,{children:[e.jsx(o,{className:"w-[100px]",children:"Invoice"}),e.jsx(o,{children:"Status"}),e.jsx(o,{children:"Method"}),e.jsx(o,{className:"text-right",children:"Amount"})]})}),e.jsx(m,{children:I.map(a=>e.jsxs(t,{children:[e.jsx(l,{className:"font-medium",children:a.invoice}),e.jsx(l,{children:a.status}),e.jsx(l,{children:a.method}),e.jsx(l,{className:"text-right",children:a.amount})]},a.invoice))}),e.jsx(p,{children:e.jsxs(t,{children:[e.jsx(l,{colSpan:3,children:"Total"}),e.jsx(l,{className:"text-right",children:"$1,750.00"})]})})]})},S=[{name:"John Doe",email:"john@example.com",role:"Admin",status:"Active"},{name:"Jane Smith",email:"jane@example.com",role:"User",status:"Active"},{name:"Bob Johnson",email:"bob@example.com",role:"User",status:"Inactive"},{name:"Alice Brown",email:"alice@example.com",role:"Moderator",status:"Active"}],h={render:()=>e.jsxs(i,{children:[e.jsx(c,{children:e.jsxs(t,{children:[e.jsx(o,{children:"Name"}),e.jsx(o,{children:"Email"}),e.jsx(o,{children:"Role"}),e.jsx(o,{children:"Status"})]})}),e.jsx(m,{children:S.map(a=>e.jsxs(t,{children:[e.jsx(l,{className:"font-medium",children:a.name}),e.jsx(l,{children:a.email}),e.jsx(l,{children:e.jsx(j,{variant:a.role==="Admin"?"default":"secondary",children:a.role})}),e.jsx(l,{children:e.jsx(j,{className:a.status==="Active"?"bg-green-100 text-green-800":"bg-gray-100 text-gray-800",children:a.status})})]},a.email))})]})},D=[{date:"2024-01-15",donor:"Anonymous",organization:"Tech for Kids",amount:"$500"},{date:"2024-01-14",donor:"John D.",organization:"Digital Literacy",amount:"$250"},{date:"2024-01-13",donor:"Sarah M.",organization:"Code Academy",amount:"$1,000"},{date:"2024-01-12",donor:"Anonymous",organization:"Tech for Kids",amount:"$150"}],x={render:()=>e.jsxs(i,{children:[e.jsx(u,{children:"Recent donations to organizations."}),e.jsx(c,{children:e.jsxs(t,{children:[e.jsx(o,{children:"Date"}),e.jsx(o,{children:"Donor"}),e.jsx(o,{children:"Organization"}),e.jsx(o,{className:"text-right",children:"Amount"})]})}),e.jsx(m,{children:D.map((a,n)=>e.jsxs(t,{children:[e.jsx(l,{children:a.date}),e.jsx(l,{children:a.donor}),e.jsx(l,{children:a.organization}),e.jsx(l,{className:"text-right font-medium",children:a.amount})]},n))})]})};var g,N,f;b.parameters={...b.parameters,docs:{...(g=b.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map(invoice => <TableRow key={invoice.invoice}>
            <TableCell className="font-medium">{invoice.invoice}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="text-right">{invoice.amount}</TableCell>
          </TableRow>)}
      </TableBody>
    </Table>
}`,...(f=(N=b.parameters)==null?void 0:N.docs)==null?void 0:f.source}}};var C,y,H;T.parameters={...T.parameters,docs:{...(C=T.parameters)==null?void 0:C.docs,source:{originalSource:`{
  render: () => <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map(invoice => <TableRow key={invoice.invoice}>
            <TableCell className="font-medium">{invoice.invoice}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="text-right">{invoice.amount}</TableCell>
          </TableRow>)}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">$1,750.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
}`,...(H=(y=T.parameters)==null?void 0:y.docs)==null?void 0:H.source}}};var v,w,R;h.parameters={...h.parameters,docs:{...(v=h.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: () => <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(user => <TableRow key={user.email}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>{user.role}</Badge>
            </TableCell>
            <TableCell>
              <Badge className={user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {user.status}
              </Badge>
            </TableCell>
          </TableRow>)}
      </TableBody>
    </Table>
}`,...(R=(w=h.parameters)==null?void 0:w.docs)==null?void 0:R.source}}};var B,A,_;x.parameters={...x.parameters,docs:{...(B=x.parameters)==null?void 0:B.docs,source:{originalSource:`{
  render: () => <Table>
      <TableCaption>Recent donations to organizations.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Donor</TableHead>
          <TableHead>Organization</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {donations.map((donation, i) => <TableRow key={i}>
            <TableCell>{donation.date}</TableCell>
            <TableCell>{donation.donor}</TableCell>
            <TableCell>{donation.organization}</TableCell>
            <TableCell className="text-right font-medium">{donation.amount}</TableCell>
          </TableRow>)}
      </TableBody>
    </Table>
}`,...(_=(A=x.parameters)==null?void 0:A.docs)==null?void 0:_.source}}};const V=["Default","WithFooter","WithBadges","DonationsTable"];export{b as Default,x as DonationsTable,h as WithBadges,T as WithFooter,V as __namedExportsOrder,E as default};
