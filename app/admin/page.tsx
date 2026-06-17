import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, isAdmin } from "@/lib/auth";
import { updateApplicationStatus } from "./actions";
import AdminNav from "@/components/AdminNav";

export const metadata: Metadata = {
  title: "Applications — Golden Shadow Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Application = {
  id: string;
  created_at: string;
  type: "creator" | "executive";
  status: "pending" | "approved" | "declined";
  name: string;
  email: string;
  website: string | null;
  category: string | null;
  tier_interest: string | null;
  audience: string | null;
  message: string;
};

const TABS = ["pending", "approved", "declined", "all"] as const;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = TABS.includes(status as (typeof TABS)[number])
    ? (status as (typeof TABS)[number])
    : "pending";

  // Preview mode — no keys yet.
  if (!isSupabaseConfigured) {
    return (
      <>
        <Nav />
        <main>
          <PageHeader eyebrow="Studio Admin" title="Applications" />
          <section className="page-section">
            <div className="empty-state">
              <h3>Admin not connected yet</h3>
              <p>
                Add your Supabase keys to <code>.env.local</code>, run the SQL
                schema, and create an admin user. This screen will then list and
                manage every application.
              </p>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  // Only studio admins may view this area. (Middleware already ensured the
  // user is signed in; here we enforce the role.)
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isAdmin(session)) redirect("/dashboard");

  const supabase = await createClient();

  let query = supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (active !== "all") query = query.eq("status", active);

  const { data, error } = await query;
  const applications = (data ?? []) as Application[];

  return (
    <>
      <Nav />
      <main>
        <PageHeader eyebrow="Studio Admin" title="Applications" />
        <section className="page-section">
          <AdminNav active="applications" />

          <p className="result-count" style={{ marginTop: "28px" }}>
            {applications.length}{" "}
            {applications.length === 1 ? "application" : "applications"}
            {active !== "all" ? ` · ${active}` : ""}
          </p>

          <div className="admin-tabs">
            {TABS.map((tab) => (
              <Link
                key={tab}
                href={`/admin?status=${tab}`}
                className={`filter-chip${active === tab ? " active" : ""}`}
              >
                {tab}
              </Link>
            ))}
          </div>

          {error ? (
            <div className="empty-state">
              <h3>Couldn&apos;t load applications</h3>
              <p>{error.message}</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <h3>Nothing here yet</h3>
              <p>
                No {active !== "all" ? active : ""} applications. New submissions
                from the Apply form will appear here.
              </p>
            </div>
          ) : (
            <div className="admin-scroll">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Type</th>
                    <th>Category / Interest</th>
                    <th>About</th>
                    <th>Received</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div className="app-name">{app.name}</div>
                        <div className="app-email">{app.email}</div>
                        {app.website && (
                          <div className="app-email">{app.website}</div>
                        )}
                      </td>
                      <td>
                        <span className="badge-type">{app.type}</span>
                      </td>
                      <td>
                        <div>{app.category ?? "—"}</div>
                        {app.tier_interest && (
                          <div className="app-email">{app.tier_interest}</div>
                        )}
                      </td>
                      <td style={{ maxWidth: "320px" }}>
                        {app.audience && (
                          <div
                            className="app-email"
                            style={{ marginBottom: "6px" }}
                          >
                            {app.audience}
                          </div>
                        )}
                        {app.message}
                      </td>
                      <td>{formatDate(app.created_at)}</td>
                      <td>
                        <span className={`status-pill status-${app.status}`}>
                          {app.status}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          {app.status !== "approved" && (
                            <form action={updateApplicationStatus}>
                              <input type="hidden" name="id" value={app.id} />
                              <input
                                type="hidden"
                                name="status"
                                value="approved"
                              />
                              <button type="submit" className="approve">
                                Approve
                              </button>
                            </form>
                          )}
                          {app.status !== "declined" && (
                            <form action={updateApplicationStatus}>
                              <input type="hidden" name="id" value={app.id} />
                              <input
                                type="hidden"
                                name="status"
                                value="declined"
                              />
                              <button type="submit" className="decline">
                                Decline
                              </button>
                            </form>
                          )}
                          {app.status !== "pending" && (
                            <form action={updateApplicationStatus}>
                              <input type="hidden" name="id" value={app.id} />
                              <input
                                type="hidden"
                                name="status"
                                value="pending"
                              />
                              <button type="submit">Reset</button>
                            </form>
                          )}
                        </div>
                      </td>
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
