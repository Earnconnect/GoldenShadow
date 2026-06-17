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

    const tier = session.metadata?.tier ?? null;
    const email = session.customer_details?.email ?? null;

    if (admin) {
      await admin.from("orders").insert({
        tier,
        mode: session.mode,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: email,
        customer_name: session.customer_details?.name ?? null,
        status: session.payment_status ?? "complete",
        stripe_session_id: session.id,
        stripe_customer_id:
          typeof session.customer === "string" ? session.customer : null,
      });

      // Best-effort: upgrade the buyer's membership plan if they have an account
      // (matched by email). Never throws — a failure here must not fail the webhook.
      if (email && (tier === "starter" || tier === "studio" || tier === "platform")) {
        try {
          const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
          const match = data?.users.find(
            (u) => u.email?.toLowerCase() === email.toLowerCase()
          );
          if (match) {
            await admin
              .from("profiles")
              .update({ plan: tier })
              .eq("id", match.id);
          }
        } catch {
          // ignore — admin can set the plan manually in /admin/users
        }
      }
    }
    // If the admin client isn't configured, we still return 200 — the payment
    // succeeded; we just couldn't record it. (Add SUPABASE_SERVICE_ROLE_KEY.)
  }

  return NextResponse.json({ received: true });
}
