import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import CreatorProfileEditor from "@/components/CreatorProfileEditor";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, isAdmin, canUseStudio, PLAN_LABEL } from "@/lib/auth";
import { getCreatorBySlug } from "@/lib/creators-db";
import { signOut } from "./actions";

export const metadata: Metadata = {
  title: "Your Dashboard — Golden Shadow Publishing",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type OrderRow = {
  amount_total: number | null;
  currency: string | null;
  mode: string | null;
  status: string | null;
};

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function DashboardPage() {
  // Preview mode — no keys yet.
  if (!isSupabaseConfigured) {
    return (
      <>
        <Nav />
        <main>
          <PageHeader eyebrow="Member Dashboard" title="Your dashboard" />
          <section className="page-section">
            <div className="empty-state">
              <h3>Dashboard not connected yet</h3>
              <p>
                Creator dashboards activate once Supabase is connected. Sign-in,
                profile editing, and revenue reporting will live here.
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

  const session = await getSession();
  if (!session) redirect("/login");

  const slug = session.profile?.creator_slug ?? null;
  const creator = slug ? await getCreatorBySlug(slug) : undefined;

  // Revenue & analytics from this member's own orders.
  const supabase = await createClient();
  let orders: OrderRow[] = [];
  if (session.email) {
    const { data } = await supabase
      .from("orders")
      .select("amount_total, currency, mode, status")
      .eq("customer_email", session.email);
    orders = (data ?? []) as OrderRow[];
  }
  const currency = orders[0]?.currency ?? "usd";
  const totalCents = orders.reduce((sum, o) => sum + (o.amount_total ?? 0), 0);
  const hasSubscription = orders.some((o) => o.mode === "subscription");

  const firstName =
    session.profile?.full_name?.split(" ")[0] ??
    creator?.name?.split(" ")[0] ??
    "there";

  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="Member Dashboard"
          title={<>Welcome back, {firstName}.</>}
          subtitle="Manage your profile, track your IP, and see your revenue at a glance."
        />
        <section className="page-section">
          <div className="account-bar">
            <div>
              <p className="account-hello">Signed in as</p>
              <p className="account-email">{session.email}</p>
            </div>
            <div className="account-right">
              {isAdmin(session) ? (
                <span className="plan-badge plan-platform">Admin</span>
              ) : (
                <span
                  className={`plan-badge plan-${session.profile?.plan ?? "none"}`}
                >
                  {PLAN_LABEL[session.profile?.plan ?? "none"] ?? "No plan"}
                </span>
              )}
              {isAdmin(session) && (
                <Link href="/admin" className="admin-signout">
                  Admin →
                </Link>
              )}
              <form action={signOut}>
                <button type="submit" className="admin-signout">
                  Sign out
                </button>
              </form>
            </div>
          </div>

          {/* Analytics */}
          <p className="profile-section-label" style={{ marginTop: "40px" }}>
            Revenue &amp; Activity
          </p>
          <div className="metric-grid">
            <div className="metric-card">
              <span className="metric-value">
                {formatAmount(totalCents, currency)}
              </span>
              <small>Total billed to you</small>
            </div>
            <div className="metric-card">
              <span className="metric-value">{orders.length}</span>
              <small>Orders &amp; payments</small>
            </div>
            <div className="metric-card">
              <span className="metric-value">
                {hasSubscription ? "Active" : "—"}
              </span>
              <small>Platform subscription</small>
            </div>
            <div className="metric-card">
              <span className="metric-value">
                {creator?.projects.length ?? 0}
              </span>
              <small>IP projects</small>
            </div>
          </div>

          {/* Studio Engine */}
          <p className="profile-section-label" style={{ marginTop: "56px" }}>
            AI Studio Engine
          </p>
          {canUseStudio(session) ? (
            <Link href="/dashboard/studio" className="studio-cta">
              <div>
                <h3>Turn your IP into a book</h3>
                <p>
                  Feed the engine your talks, transcripts, and notes — get an IP
                  blueprint, book architecture, a sample chapter, and a product
                  suite. Human-led, AI-accelerated.
                </p>
              </div>
              <span className="studio-cta-arrow">Open the Studio Engine →</span>
            </Link>
          ) : (
            <Link href="/#pricing" className="studio-cta">
              <div>
                <h3>Unlock the Studio Engine</h3>
                <p>
                  The AI publishing engine is available on the Studio and
                  Platform plans. Upgrade to turn your IP into a book.
                </p>
              </div>
              <span className="studio-cta-arrow">View plans →</span>
            </Link>
          )}

          {/* Profile editor */}
          <p className="profile-section-label" style={{ marginTop: "56px" }}>
            Your Public Profile
          </p>
          {slug && creator ? (
            <>
              <p
                className="form-fineprint"
                style={{ marginTop: "-8px", marginBottom: "24px" }}
              >
                Edits appear on{" "}
                <Link href={`/creators/${slug}`} className="jlink">
                  your public profile
                </Link>{" "}
                after saving.
              </p>
              <div style={{ maxWidth: "720px" }}>
                <CreatorProfileEditor creator={creator} />
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h3>No public profile linked yet</h3>
              <p>
                Your account isn&apos;t linked to a creator profile. Your studio
                contact will connect it — then you can edit it here.
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
