import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Thank You — Golden Shadow Publishing",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatAmount(amount: number | null, currency: string | null) {
  if (amount == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency ?? "usd").toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let summary: { name: string; amount: string | null } | null = null;
  const stripe = getStripe();
  if (stripe && session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      summary = {
        name:
          session.customer_details?.name ??
          session.customer_details?.email ??
          "there",
        amount: formatAmount(session.amount_total, session.currency),
      };
    } catch {
      summary = null;
    }
  }

  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="Confirmed"
          title={
            <>
              Thank you{summary ? `, ${summary.name}` : ""}.
            </>
          }
          subtitle="Your payment was received. A receipt is on its way to your inbox, and our studio team will reach out with next steps shortly."
          breadcrumbs={[{ href: "/", label: "Home" }]}
        />
        <section className="page-section">
          <div className="empty-state">
            <h3>You&apos;re all set</h3>
            <p>
              {summary?.amount
                ? `We've confirmed your ${summary.amount} payment. `
                : "We've confirmed your payment. "}
              Keep an eye out for an email from Golden Shadow with your
              onboarding details.
            </p>
            <Link href="/" className="btn-dark">
              Back to Home
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
