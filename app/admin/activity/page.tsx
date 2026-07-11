import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import AdminNav from "@/components/AdminNav";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Activity — Golden Shadow Admin",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  created_at: string;
  actor: string | null;
  action: string;
  detail: string | null;
};

const LABELS: Record<string, string> = {
  "application.submitted": "Application submitted",
  "application.approved": "Application approved",
  "application.declined": "Application declined",
  "application.pending": "Application reopened",
  "inquiry.sent": "Conversation started",
  "message.sent": "Message reply",
  "profile.updated": "Profile edited",
  "avatar.updated": "Photo updated",
  "studio.generate": "AI generated",
  "user.updated": "User updated",
  "order.paid": "Payment",
};

function when(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminActivityPage() {
  if (!isSupabaseConfigured) {
    return (
      <>
        <Nav />
        <main>
          <PageHeader eyebrow="Studio Admin" title="Activity" />
          <section className="page-section">
            <div className="empty-state">
              <h3>Admin not connected yet</h3>
              <p>Connect Supabase to see the platform activity feed.</p>
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

  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_log")
    .select("id, created_at, actor, action, detail")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <Nav />
      <main>
        <PageHeader eyebrow="Studio Admin" title="Activity" />
        <section className="page-section">
          <AdminNav active="activity" />

          <p className="profile-section-label" style={{ marginTop: "32px" }}>
            Recent activity ({rows.length})
          </p>

          {rows.length === 0 ? (
            <p className="form-fineprint">
              Nothing logged yet. As people apply, message, pay, and generate
              work, their actions will appear here newest-first.
            </p>
          ) : (
            <div className="admin-scroll">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Who</th>
                    <th>Action</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{when(r.created_at)}</td>
                      <td>{r.actor ?? "—"}</td>
                      <td>
                        <span className="status-pill status-pending">
                          {LABELS[r.action] ?? r.action}
                        </span>
                      </td>
                      <td style={{ maxWidth: "360px" }}>{r.detail ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
