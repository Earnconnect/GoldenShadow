import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import AdminNav from "@/components/AdminNav";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, isAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { saveSettings } from "./actions";

export const metadata: Metadata = {
  title: "Settings — Golden Shadow Admin",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;

  if (!isSupabaseConfigured) {
    return (
      <>
        <Nav />
        <main>
          <PageHeader eyebrow="Studio Admin" title="Settings" />
          <section className="page-section">
            <div className="empty-state">
              <h3>Admin not connected yet</h3>
              <p>Connect Supabase to control site copy and toggles here.</p>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isAdmin(session)) redirect("/dashboard");

  const s = await getSettings();

  return (
    <>
      <Nav />
      <main>
        <PageHeader eyebrow="Studio Admin" title="Site Settings" />
        <section className="page-section">
          <AdminNav active="settings" />

          {saved && (
            <p className="form-success" style={{ marginTop: "28px" }}>
              Settings saved.
            </p>
          )}

          <form
            action={saveSettings}
            className="apply-form"
            style={{ maxWidth: "720px", marginTop: "32px" }}
          >
            <p className="profile-section-label">Homepage Hero</p>
            <div className="form-field">
              <label className="form-label" htmlFor="hero_eyebrow">
                Eyebrow line
              </label>
              <input
                id="hero_eyebrow"
                name="hero_eyebrow"
                type="text"
                defaultValue={s.heroEyebrow}
                maxLength={160}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="hero_subtitle">
                Subtitle paragraph
              </label>
              <textarea
                id="hero_subtitle"
                name="hero_subtitle"
                rows={3}
                defaultValue={s.heroSubtitle}
                maxLength={600}
              />
            </div>

            <p className="profile-section-label" style={{ marginTop: "32px" }}>
              Contact &amp; Applications
            </p>
            <div className="form-field">
              <label className="form-label" htmlFor="contact_email">
                Contact email
              </label>
              <input
                id="contact_email"
                name="contact_email"
                type="email"
                defaultValue={s.contactEmail}
                maxLength={160}
              />
              <p className="form-fineprint">
                Shown to applicants and used for studio contact links.
              </p>
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                name="applications_open"
                defaultChecked={s.applicationsOpen}
              />{" "}
              Accept new applications (uncheck to pause the apply form)
            </label>

            <button type="submit" className="btn-dark">
              Save settings
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
