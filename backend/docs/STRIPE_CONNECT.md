# Stripe Connect Integration

This document describes the Stripe Connect implementation for routing donations to organization accounts.

## Overview

Stripe Connect enables the platform to:
- Route donations directly to organization bank accounts
- Collect a platform fee on each transaction
- Handle onboarding for new organizations
- Track payment status and transfers

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Donor     │────▶│  Platform   │────▶│    Org      │
│  (Browser)  │     │  (Backend)  │     │  (Stripe)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │   Payment         │   Destination     │
       │   Intent          │   Charge          │
       └───────────────────┴───────────────────┘
```

**Flow:**
1. Donor initiates payment on frontend
2. Backend creates PaymentIntent with destination charge
3. Stripe processes payment, deducts platform fee
4. Remaining amount transfers to organization's connected account

---

## Database Schema

### Organizations Table (updated)

```sql
ALTER TABLE organizations
ADD COLUMN stripe_account_id VARCHAR(255),
ADD COLUMN stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN stripe_charges_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN stripe_details_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN stripe_connected_at TIMESTAMP WITH TIME ZONE;
```

### Payment Transactions Table

```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES requests(id),
  campaign_id UUID REFERENCES campaigns(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  donor_id TEXT NOT NULL,

  -- Stripe identifiers
  stripe_payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_charge_id VARCHAR(255),
  stripe_transfer_id VARCHAR(255),

  -- Amounts (stored in cents)
  amount_total INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  organization_amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',

  -- Status: pending, processing, succeeded, failed, refunded
  status VARCHAR(50) NOT NULL DEFAULT 'pending',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);
```

### Platform Fee Settings

Stored in `platform_settings` table:
- `stripe_platform_fee_percent`: 2.9 (percentage)
- `stripe_platform_fee_fixed_cents`: 30 (fixed fee in cents)
- `stripe_test_mode`: true/false

---

## API Endpoints

### 1. Create Connected Account

**POST** `/api/stripe/connect/create-account`

Creates a Stripe Express account for an organization.

**Request:**
```json
{
  "organizationId": "uuid-here"
}
```

**Response:**
```json
{
  "accountId": "acct_xxxxx"
}
```

### 2. Generate Onboarding Link

**POST** `/api/stripe/connect/onboarding-link`

Generates a Stripe-hosted onboarding URL.

**Request:**
```json
{
  "organizationId": "uuid-here"
}
```

**Response:**
```json
{
  "url": "https://connect.stripe.com/setup/..."
}
```

**Redirect URLs:**
- Success: `{FRONTEND_URL}/cbo/dashboard?stripe=complete`
- Refresh: `{FRONTEND_URL}/cbo/dashboard?stripe=refresh`

### 3. Get Account Status

**GET** `/api/stripe/connect/status/:organizationId`

Returns the current Stripe Connect status for an organization.

**Response:**
```json
{
  "connected": true,
  "accountId": "acct_xxxxx",
  "chargesEnabled": true,
  "payoutsEnabled": true,
  "detailsSubmitted": true,
  "onboardingComplete": true,
  "requirements": {
    "currently_due": [],
    "eventually_due": [],
    "past_due": []
  }
}
```

### 4. Create Payment Intent (Updated)

**POST** `/api/payments/create-intent`

Creates a payment intent with destination charge.

**Request:**
```json
{
  "requestId": "uuid-here",
  "amount": 5000,
  "donorId": "user_xxxxx"
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxxxx_secret_xxxxx"
}
```

**Internal Logic:**
- Validates organization has `stripe_charges_enabled = true`
- Calculates platform fee: `(amount * 2.9%) + 30¢`
- Creates PaymentIntent with:
  - `transfer_data.destination`: organization's Stripe account
  - `application_fee_amount`: platform fee in cents

---

## Frontend Components

### StripeConnectButton

Location: `frontend-vite/src/components/StripeConnectButton.tsx`

Displays connection status and handles onboarding:
- **Not Connected**: Shows "Connect Stripe Account" button
- **Setup Incomplete**: Shows warning + "Complete Stripe Setup" button
- **Connected**: Shows green "Stripe Connected" badge

### StripeConnectCard

Full card component for the dashboard settings page. Shows:
- Connection status
- Charges enabled status
- Payouts enabled status

### useStripeConnect Hook

Location: `frontend-vite/src/hooks/useStripeConnect.ts`

```typescript
const { status, loading, error, refetch, isRefreshing } = useStripeConnect(organizationId)
```

Features:
- Fetches and caches Stripe Connect status
- Handles URL params after onboarding return (`?stripe=complete`)
- Auto-refreshes status after onboarding

---

## Webhook Events

The webhook endpoint at `/api/payments/webhook` handles:

### Payment Events
- `payment_intent.succeeded` - Payment completed
- `payment_intent.payment_failed` - Payment failed

### Connect Events
- `account.updated` - Connected account status changed
- `transfer.created` - Transfer to connected account created

---

## Environment Variables

### Backend (.env)

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Frontend URL for redirects
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

---

## Testing

### Setup Stripe CLI

```bash
# Install
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:4000/api/payments/webhook
```

### Test Card Numbers

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0000 0000 9995 | Insufficient funds |

Use any future expiry date and any 3-digit CVC.

### Test Onboarding

During Stripe Connect onboarding in test mode:
1. Use phone: `000 000 0000`
2. Use verification code: `000000`
3. Use SSN last 4: `0000`
4. Use any test bank account (routing: `110000000`, account: `000123456789`)

### End-to-End Test Flow

1. **Run database migration**
   ```bash
   psql $DATABASE_URL < supabase/migrations/20240315000000_stripe_connect.sql
   ```

2. **Start backend**
   ```bash
   cd backend && npm start
   ```

3. **Start webhook listener**
   ```bash
   stripe listen --forward-to localhost:4000/api/payments/webhook
   ```

4. **Start frontend**
   ```bash
   cd frontend-vite && npm run dev
   ```

5. **As CBO user:**
   - Login as organization admin
   - Go to Dashboard → Settings
   - Click "Connect Stripe Account"
   - Complete Stripe onboarding with test data

6. **As Donor:**
   - Browse to a request from the connected org
   - Click "Fulfill Request"
   - Enter test card details
   - Complete payment

7. **Verify in Stripe Dashboard:**
   - Payment appears in Payments
   - Transfer created to connected account
   - Application fee collected

---

## Fee Calculation

Platform fees are calculated as:

```
platformFee = (amount * feePercent / 100) + fixedFeeCents
organizationAmount = amount - platformFee
```

**Example:** $50.00 donation
- Amount: 5000 cents
- Fee: (5000 * 2.9 / 100) + 30 = 145 + 30 = 175 cents ($1.75)
- Organization receives: 5000 - 175 = 4825 cents ($48.25)

---

## Troubleshooting

### "Organization cannot accept payments"

The organization's `stripe_charges_enabled` is `false`. They need to:
1. Complete Stripe Connect onboarding
2. Verify their identity
3. Add bank account for payouts

### "Failed to create Stripe account"

Check:
- Backend has valid `STRIPE_SECRET_KEY`
- Organization exists in database
- Network connectivity to Stripe API

### Webhook events not processing

Check:
- Stripe CLI is running and forwarding
- `STRIPE_WEBHOOK_SECRET` matches the CLI output
- Backend is running on correct port

### Onboarding redirect fails

Verify:
- `FRONTEND_URL` is set correctly in backend .env
- Frontend is running on expected port

---

## Security Considerations

1. **Never expose secret keys** - Keep `STRIPE_SECRET_KEY` server-side only
2. **Validate webhook signatures** - Always verify `stripe-signature` header
3. **Check account status** - Verify `chargesEnabled` before processing payments
4. **Use HTTPS in production** - Required for Stripe Connect redirects
5. **Idempotent webhooks** - Check for duplicate events before processing

---

## Files Reference

| File | Purpose |
|------|---------|
| `backend/supabase/migrations/20240315000000_stripe_connect.sql` | Database schema |
| `backend/api/server.js` | API endpoints |
| `frontend-vite/src/components/StripeConnectButton.tsx` | Connect UI components |
| `frontend-vite/src/hooks/useStripeConnect.ts` | Status management hook |
| `frontend-vite/src/pages/cbo/DashboardPage.tsx` | CBO dashboard with settings |
| `frontend-vite/src/pages/CheckoutPage.tsx` | Payment page with org verification |

---

## Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Express Accounts](https://stripe.com/docs/connect/express-accounts)
- [Destination Charges](https://stripe.com/docs/connect/destination-charges)
- [Testing Connect](https://stripe.com/docs/connect/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
