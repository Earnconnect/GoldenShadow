import Stripe from "stripe";

const SECRET = process.env.STRIPE_SECRET_KEY ?? "";

export const isStripeConfigured = SECRET.length > 0;

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Lazily-created Stripe client. Returns null when not configured so callers
// can fall back gracefully instead of throwing at import time.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!isStripeConfigured) return null;
  if (!_stripe) {
    _stripe = new Stripe(SECRET);
  }
  return _stripe;
}
