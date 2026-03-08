# KCDD Market - Backend API

Express.js API server for handling Stripe payments and webhooks.

## Quick Start

```bash
# Install dependencies
npm install

# Start server
npm start

# Development mode (with auto-reload)
npm run dev
```

Server will start on http://localhost:4000

## Project Structure

```
backend/api/
├── server.js          # Main Express server
├── package.json       # Dependencies
├── .env               # Environment variables (do not commit!)
├── .env.example       # Environment template
└── README.md          # This file
```

## API Endpoints

### Health Check

```http
GET /health
```

Returns server status.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-11-17T12:00:00.000Z",
  "environment": "development"
}
```

### Create Payment Intent

```http
POST /api/payments/create-intent
Content-Type: application/json

{
  "requestId": "uuid",
  "amount": 5000
}
```

Creates a Stripe payment intent.

**Response:**

```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### Stripe Webhook

```http
POST /api/payments/webhook
Content-Type: application/json
Stripe-Signature: xxx
```

Handles Stripe webhook events.

**Events handled:**

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

## Environment Variables

Create a `.env` file:

```env
# Server
PORT=4000
NODE_ENV=development

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Supabase
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Clerk (optional)
CLERK_SECRET_KEY=sk_test_xxxxx
```

## Stripe Setup

### 1. Get API Keys

1. Go to [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Copy your test keys
3. Add to `.env`

### 2. Set Up Webhook (Local Development)

Install Stripe CLI:

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:4000/api/payments/webhook
```

Copy the webhook signing secret to `.env`.

### 3. Test Payment

Use test card: `4242 4242 4242 4242`

**Documentation:**

- [Stripe API](https://stripe.com/docs/api)
- [Webhooks](https://stripe.com/docs/webhooks)
- [Testing](https://stripe.com/docs/testing)

## Supabase Integration

The API uses Supabase to:

- Update request status after payment
- Create notifications
- Store payment records

**Service Role Key** is used for admin access (bypasses RLS).

**WARNING: Keep service role key secret!** Never expose it in frontend.

## Security

- CORS restricted to allowed origins
- Webhook signature verification
- Service role key for database access
- Environment variables for secrets

## Deployment

### Railway

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

Add environment variables in Railway dashboard.

### Render

1. Connect Git repository
2. Create Web Service
3. Set root directory: `backend/api`
4. Add environment variables
5. Deploy

### Heroku

```bash
heroku create kcdd-market-api
git subtree push --prefix backend/api heroku main
```

## Troubleshooting

### Port already in use

Change `PORT` in `.env` or kill the process:

```bash
lsof -i :4000
kill -9 <PID>
```

### Webhook signature verification failed

Make sure:

- Stripe CLI is forwarding to correct URL
- `STRIPE_WEBHOOK_SECRET` matches CLI output
- Request body is raw (not parsed)

### CORS errors

Add your frontend URL to `ALLOWED_ORIGINS` in `.env`

### Supabase connection failed

Check:

- Supabase is running (if Docker)
- URL and service role key are correct
- Network connectivity

## Documentation

- [Express.js](https://expressjs.com/)
- [Stripe Node.js](https://stripe.com/docs/api/node)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

## Logs

Server logs all important events:

- Payment successes/failures
- Webhook events
- Errors

Check console output for debugging.

## Testing

Test webhook locally:

```bash
# Send test event
stripe trigger payment_intent.succeeded
```

## License

MIT

## Contributing

See main README.md for contribution guidelines.
