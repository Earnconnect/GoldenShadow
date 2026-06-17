import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getStripe,
  isStripeConfigured,
  STRIPE_WEBHOOK_SECRET,
} from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe needs the raw request body to verify the signature.
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!isStripeConfigured || !stripe || !STRIPE_WEBHOOK_SECRET) {
    // Not configured — acknowledge so Stripe doesn't retry endlessly.
    return NextResponse.json({ received: true, skipped: "not configured" });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "invalid signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const admin = createAdminClient();

    if (admin) {
      await admin.from("orders").insert({
        tier: session.metadata?.tier ?? null,
        mode: session.mode,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_details?.email ?? null,
        customer_name: session.customer_details?.name ?? null,
        status: session.payment_status ?? "complete",
        stripe_session_id: session.id,
        stripe_customer_id:
          typeof session.customer === "string" ? session.customer : null,
      });
    }
    // If the admin client isn't configured, we still return 200 — the payment
    // succeeded; we just couldn't record it. (Add SUPABASE_SERVICE_ROLE_KEY.)
  }

  return NextResponse.json({ received: true });
}
