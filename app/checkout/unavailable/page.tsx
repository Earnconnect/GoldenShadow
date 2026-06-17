import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Checkout Unavailable — Golden Shadow Publishing",
  robots: { index: false, follow: false },
};

export default function CheckoutUnavailablePage() {
  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="Checkout"
          title="Payments aren't live yet"
          subtitle="Online checkout is being connected. In the meantime, apply and our team will arrange payment with you directly."
          breadcrumbs={[{ href: "/", label: "Home" }]}
        />
        <section className="page-section">
          <div className="empty-state">
            <h3>Almost there</h3>
            <p>
              Secure card payments are coming online shortly. Apply now and a
              member of the studio will be in touch to get you started.
            </p>
            <Link href="/apply" className="btn-dark">
              Apply to Join
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
