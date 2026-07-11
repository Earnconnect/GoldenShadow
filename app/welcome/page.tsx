import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import SetPassword from "@/components/SetPassword";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Complete your registration — Golden Shadow Publishing",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const session = isSupabaseConfigured ? await getSession() : null;

  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="Welcome to Golden Shadow"
          title={
            <>
              Complete your <em>registration.</em>
            </>
          }
          subtitle={
            session
              ? "Set a password to finish setting up your account and start using the platform."
              : undefined
          }
        />
        <section className="page-section" style={{ maxWidth: "600px" }}>
          {session ? (
            <>
              <p className="form-fineprint" style={{ marginTop: "-8px", marginBottom: "24px" }}>
                Signed in as {session.email}
              </p>
              <SetPassword />
            </>
          ) : (
            <div className="empty-state">
              <h3>This link has expired or is invalid</h3>
              <p>
                Registration links are single-use and time-limited. If yours
                stopped working, reach out to the studio and we&apos;ll send a
                fresh one.
              </p>
              <Link href="/login" className="btn-dark">
                Go to login
              </Link>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
