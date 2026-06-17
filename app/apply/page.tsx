import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import ApplyForm from "@/components/ApplyForm";

export const metadata: Metadata = {
  title: "Apply — Golden Shadow Publishing",
  description:
    "Apply to turn your expertise into books, products, and enduring revenue with Golden Shadow Publishing.",
};

export default function ApplyPage() {
  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="Apply to Join"
          title={
            <>
              Let&apos;s turn your expertise
              <br />
              into <em>legacy.</em>
            </>
          }
          subtitle="Tell us about your work and goals. We partner with a curated number of creators and leaders each year."
          breadcrumbs={[{ href: "/", label: "Home" }]}
        />
        <section className="page-section apply-section">
          <ApplyForm />
          <p
            className="pricing-note"
            style={{ marginTop: "32px", textAlign: "center" }}
          >
            Already a member? <Link href="/login">Log in →</Link>
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
