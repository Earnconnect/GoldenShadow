import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import AccountSettings from "@/components/AccountSettings";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Account Settings — Golden Shadow Publishing",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!isSupabaseConfigured) {
    return (
      <>
        <Nav />
        <main>
          <PageHeader eyebrow="Account" title="Settings" />
          <section className="page-section">
            <div className="empty-state">
              <h3>Not connected yet</h3>
              <p>Account settings activate once the platform is connected.</p>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="Account"
          title="Settings"
          subtitle="Manage your name, email, and password."
          breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }]}
        />
        <section className="page-section" style={{ maxWidth: "720px" }}>
          <AccountSettings
            userId={session.userId}
            initialName={session.profile?.full_name ?? ""}
            initialEmail={session.email ?? ""}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}
