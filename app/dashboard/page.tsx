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
import { toChapterSet } from "@/lib/anthropic/types";
import { signOut, markInquiryHandled } from "./actions";

type InquiryRow = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  status: string;
};

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

  // Book project progress — derived from the member's AI artifacts.
  const { data: artifactData } = await supabase
    .from("ai_artifacts")
    .select("kind, content, review_status")
    .eq("user_id", session.userId);
  const artifacts = (artifactData ?? []) as {
    kind: string;
    content: unknown;
    review_status: string | null;
  }[];
  const kinds = new Set(artifacts.map((a) => a.kind));
  const chapterRow = artifacts.find((a) => a.kind === "chapter");
  const chapterCount = chapterRow
    ? toChapterSet(chapterRow.content).chapters.length
    : 0;
  const approvedCount = artifacts.filter(
    (a) => a.review_status === "approved"
  ).length;
  const projectSteps = [
    { label: "Source material", done: kinds.has("source") },
    { label: "IP Blueprint", done: kinds.has("blueprint") },
    { label: "Book Architecture", done: kinds.has("architecture") },
    {
      label:
        chapterCount > 0 ? `Chapters drafted (${chapterCount})` : "Chapters",
      done: chapterCount > 0,
    },
    { label: "Product Suite", done: kinds.has("product_suite") },
  ];
  const stepsDone = projectSteps.filter((s) => s.done).length;
  const hasProject = artifacts.length > 0;

  // Partnership requests addressed to this creator (RLS returns only their own).
  let inquiries: InquiryRow[] = [];
  if (slug) {
    const { data: inqData } = await supabase
      .from("inquiries")
      .select("id, created_at, name, email, company, message, status")
      .eq("creator_slug", slug)
      .order("created_at", { ascending: false });
    inquiries = (inqData ?? []) as InquiryRow[];
  }
  const newInquiries = inquiries.filter((q) => q.status !== "handled").length;

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
              <Link href="/dashboard/settings" className="admin-signout">
                Settings
              </Link>
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

          {/* Book project progress */}
          {hasProject && (
            <>
              <p className="profile-section-label" style={{ marginTop: "56px" }}>
                Your Book Project
              </p>
              <div className="project-tracker">
                <div className="project-track-head">
                  <span>
                    {stepsDone} of {projectSteps.length} stages
                  </span>
                  {approvedCount > 0 && (
                    <span className="status-pill status-approved">
                      {approvedCount} studio-approved
                    </span>
                  )}
                </div>
                <div className="project-steps">
                  {projectSteps.map((s, i) => (
                    <div
                      className={`project-step${s.done ? " done" : ""}`}
                      key={i}
                    >
                      <span className="ps-dot">{s.done ? "✓" : i + 1}</span>
                      <span className="ps-label">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Partnership requests (creator inbox) */}
          {slug && (
            <>
              <p className="profile-section-label" style={{ marginTop: "56px" }}>
                Partnership Requests
                {newInquiries > 0 && (
                  <span className="status-pill status-pending" style={{ marginLeft: "12px" }}>
                    {newInquiries} new
                  </span>
                )}
              </p>
              {inquiries.length === 0 ? (
                <p className="form-fineprint">
                  When brands, publishers, or partners reach out from your public
                  profile, their messages land here for you to reply to directly.
                </p>
              ) : (
                <div className="admin-scroll">
                  <table className="app-table">
                    <thead>
                      <tr>
                        <th>From</th>
                        <th>Message</th>
                        <th>Received</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inquiries.map((q) => (
                        <tr key={q.id}>
                          <td>
                            <div className="app-name">{q.name}</div>
                            <div className="app-email">{q.email}</div>
                            {q.company && <div className="app-email">{q.company}</div>}
                          </td>
                          <td style={{ maxWidth: "340px" }}>{q.message}</td>
                          <td>
                            {new Date(q.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td>
                            <div className="row-actions">
                              <a
                                href={`mailto:${q.email}?subject=${encodeURIComponent(
                                  "Re: your message via Golden Shadow"
                                )}`}
                                className="filter-chip"
                              >
                                Reply
                              </a>
                              <form action={markInquiryHandled}>
                                <input type="hidden" name="id" value={q.id} />
                                <input
                                  type="hidden"
                                  name="status"
                                  value={q.status === "handled" ? "new" : "handled"}
                                />
                                <button type="submit">
                                  {q.status === "handled" ? "Reopen" : "Mark handled"}
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

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
