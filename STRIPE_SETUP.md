# Connecting Stripe (Phase 4 — Payments)

The checkout flow is fully built. Until you add Stripe keys, the "Book IP Audit"
and Platform buttons send people to a friendly "payments aren't live yet" page.

What's wired up:
- **Starter ($750)** → one-time Stripe Checkout
- **Platform ($2,500/mo)** → Stripe subscription Checkout
- **Studio** → stays application-only (routes to `/apply`), matching the template
- Successful payments are recorded to the `orders` table and shown in **/admin → Orders**

> Any tier can be made purchasable (or not) by editing its `checkout` block in
> `lib/data.ts`. No code changes needed.

## 1. Get your Stripe keys (use TEST mode first)
1. Sign in at https://dashboard.stripe.com.
2. Toggle **Test mode** (top-right) while setting up.
3. **Developers → API keys** → copy the **Secret key** (`sk_test_...`).

## 2. Add keys to the app
In `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
Restart `npm run dev`. The pricing buttons now open real Stripe Checkout.
Test with Stripe's card `4242 4242 4242 4242`, any future expiry, any CVC.

## 3. Record orders (webhook)
This is what writes paid orders into the `/admin → Orders` table.

**Local testing** (with the Stripe CLI):
1. Install the CLI: https://stripe.com/docs/stripe-cli
2. Run: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. It prints a signing secret (`whsec_...`). Put it in `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
4. Also add your Supabase **service-role** key so the webhook can write orders
   (Supabase → Project Settings → API → `service_role` — **keep this secret**):
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJ...service-role...
   ```
5. Restart `npm run dev`, make a test purchase, and watch the order appear in
   **/admin → Orders**.

**Production** (Vercel):
1. **Developers → Webhooks → Add endpoint**: `https://yourdomain.com/api/webhooks/stripe`
2. Subscribe to the event **`checkout.session.completed`**.
3. Copy that endpoint's signing secret into your Vercel env vars as
   `STRIPE_WEBHOOK_SECRET`, along with `STRIPE_SECRET_KEY` (live `sk_live_...`),
   `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`.

## Security notes
- **Secret key** (`sk_...`), **webhook secret** (`whsec_...`), and **service-role
  key** are all SERVER-ONLY. They live in `.env.local` / Vercel env — never in the
  browser, never committed to git (`.env.local` is gitignored).
- Go **live** by swapping test keys for live keys (`sk_live_...`) and creating a
  live-mode webhook endpoint. Do a real low-value test before launch.
