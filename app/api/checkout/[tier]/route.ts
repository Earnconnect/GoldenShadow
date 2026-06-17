import { NextResponse, type NextRequest } from "next/server";
import { getStripe, isStripeConfigured, SITE_URL } from "@/lib/stripe";
import { getPricingTierBySlug } from "@/lib/data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tier: string }> }
) {
  const { tier: tierSlug } = await params;
  const tier = getPricingTierBySlug(tierSlug);

  // Unknown tier, or a tier that isn't directly purchasable → application flow.
  if (!tier || !tier.checkout) {
    return NextResponse.redirect(new URL("/apply", SITE_URL));
  }

  // No Stripe keys yet → graceful preview fallback.
  if (!isStripeConfigured) {
    return NextResponse.redirect(
      new URL("/checkout/unavailable", SITE_URL)
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.redirect(new URL("/checkout/unavailable", SITE_URL));
  }

  const { mode, unitAmount, interval, productName } = tier.checkout;

  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: unitAmount,
            product_data: { name: productName },
            ...(mode === "subscription" && interval
              ? { recurring: { interval } }
              : {}),
          },
        },
      ],
      // Surface metadata to the webhook so we can record which tier was bought.
      metadata: { tier: tier.slug, mode },
      ...(mode === "subscription"
        ? { subscription_data: { metadata: { tier: tier.slug } } }
        : { payment_intent_data: { metadata: { tier: tier.slug } } }),
      success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/#pricing`,
      billing_address_collection: "auto",
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.redirect(new URL("/checkout/unavailable", SITE_URL));
    }
    return NextResponse.redirect(session.url, { status: 303 });
  } catch {
    return NextResponse.redirect(new URL("/checkout/unavailable", SITE_URL));
  }
}
