# KC Digital Drive Market - Frontend (Vite)

Modern React application built with Vite, TypeScript, and Tailwind CSS.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   └── Navbar.tsx     # Navigation component
├── pages/             # Page components
│   ├── HomePage.tsx
│   ├── RequestsPage.tsx
│   ├── CheckoutPage.tsx
│   ├── donor/         # Donor pages
│   └── cbo/           # CBO pages
├── layouts/           # Layout components
│   └── MainLayout.tsx
├── lib/               # Utilities
│   ├── supabase.ts   # Supabase client
│   ├── stripe.ts     # Stripe utilities
│   └── utils.ts      # Helper functions
├── hooks/             # Custom React hooks
│   └── useClerkSupabase.ts
├── routes/            # Route configuration
│   └── index.tsx
├── config/            # App configuration
│   └── index.ts      # Centralized config
├── types/             # TypeScript types
│   └── database.ts
├── styles/            # Global styles
│   └── globals.css
├── App.tsx            # Root component
└── main.tsx           # Entry point
```

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Clerk** - Authentication
- **Supabase** - Database
- **Stripe** - Payments
- **React Router** - Routing

## Environment Variables

Create a `.env.local` file with these variables:

```env
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx

# Supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# API
VITE_API_URL=http://localhost:4000

# App Config
VITE_APP_NAME=KC Digital Drive Market
VITE_ENVIRONMENT=development
```

See `.env.example` for complete list.

## Documentation
 
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Clerk Documentation](https://clerk.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

## UI Components

All UI components are from [shadcn/ui](https://ui.shadcn.com/):

- Button, Card, Dialog, Alert
- Input, Select, Checkbox, Switch
- Badge, Avatar, Separator
- Toast, Popover, Dropdown Menu
- And more...

## Authentication

Authentication is handled by Clerk. The app uses:

- Email/password sign-in
- Social authentication (Google, etc.)
- Protected routes
- User management

The `useClerkSupabase` hook syncs Clerk auth with Supabase.

## Payments

Stripe integration for payment processing:

- Payment intents
- Card element
- Webhook handling (backend)
- Test mode for development

## Database

Supabase PostgreSQL database with:

- Type-safe queries
- Real-time subscriptions
- Row-level security
- Automatic API generation

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel login
vercel
```

Add environment variables in Vercel dashboard.

### Other Platforms

- **Netlify**: Connect Git repo
- **Render**: Static site deployment
- **AWS Amplify**: Connect Git repo

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

## Troubleshooting

### Port already in use

Change port in `vite.config.ts`:

```ts
server: {
  port: 3001, // or any other port
}
```

### Environment variables not loading

- Restart dev server after changing `.env.local`
- Ensure variables start with `VITE_`
- Check for typos in variable names

### TypeScript errors

```bash
npm run type-check
```

## License

MIT

## Contributing

See main README.md for contribution guidelines.

