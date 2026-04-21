# RouteFlow — Backend Setup Guide

## File Structure
```
routeflow/
├── client/
│   └── index.html          ← Your frontend (open this in a browser)
└── server/
    ├── .env.example        ← Copy to .env and fill in values
    ├── package.json
    ├── index.js
    ├── models/User.js
    ├── middleware/auth.js
    ├── controllers/
    │   ├── authController.js
    │   └── subscriptionController.js
    └── routes/
        ├── auth.js
        └── subscription.js
```

## Setup Steps

### 1. MongoDB Atlas
- Create free cluster at https://cloud.mongodb.com
- Get connection string → paste as `MONGODB_URI`

### 2. Stripe
- Create account at https://stripe.com
- Create 2 products: $9.99/month and $59.99/year
- Copy their Price IDs → `STRIPE_MONTHLY_PRICE_ID` / `STRIPE_YEARLY_PRICE_ID`
- Copy Secret Key → `STRIPE_SECRET_KEY`
- Create webhook at Dashboard → Webhooks:
  - URL: `https://yourdomain.com/api/webhook`
  - Events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`
  - Copy Webhook Secret → `STRIPE_WEBHOOK_SECRET`

### 3. Configure .env
```bash
cd server
cp .env.example .env
# Fill in all values in .env
```

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Install & Run
```bash
cd server
npm install
npm run dev     # development
npm start       # production
```

### 5. Frontend
- Open `client/index.html` in a browser (or serve it)
- For production: change `API_BASE` at the top of the `<script>` to your server URL

## How It Works
1. User registers/logs in → JWT stored in localStorage
2. After login, app checks `/api/subscription-status`
3. No active subscription → paywall shown
4. User clicks "Start Trial" → Stripe Checkout (7-day free trial)
5. Stripe webhook fires → user's status set to `trialing`
6. Trial banner shows days remaining in-app
7. After trial ends / card charged → status becomes `active`
