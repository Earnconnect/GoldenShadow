import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import ApplyForm from "@/components/ApplyForm";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Apply — Golden Shadow Publishing",
  description:
    "Apply to turn your expertise into books, products, and enduring revenue with Golden Shadow Publishing.",
};

export const revalidate = 60;

export default async function ApplyPage() {
  const settings = await getSettings();

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
          {settings.applicationsOpen ? (
            <>
              <ApplyForm />
              <p
                className="pricing-note"
                style={{ marginTop: "32px", textAlign: "center" }}
              >
                Already a member? <Link href="/login">Log in →</Link>
              </p>
            </>
          ) : (
            <div className="empty-state">
              <h3>Applications are currently closed</h3>
              <p>
                We&apos;ve paused new applications for now. Reach out and
                we&apos;ll let you know when intake reopens.
              </p>
              <a href={`mailto:${settings.contactEmail}`} className="btn-dark">
                Contact the Studio
              </a>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
