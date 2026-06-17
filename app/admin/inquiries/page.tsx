import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import AdminNav from "@/components/AdminNav";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, isAdmin } from "@/lib/auth";
import { getCreatorBySlug } from "@/lib/data";
import { setInquiryStatus } from "./actions";

export const metadata: Metadata = {
  title: "Inquiries — Golden Shadow Admin",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InquiryRow = {
  id: string;
  created_at: string;
  creator_slug: string | null;
  name: string;
  email: string;
  company: string | null;
  message: string;
  status: string;
};

const TABS = ["new", "handled", "all"] as const;

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = TABS.includes(status as (typeof TABS)[number])
    ? (status as (typeof TABS)[number])
    : "new";

  if (!isSupabaseConfigured) {
    return (
      <>
        <Nav />
        <main>
          <PageHeader eyebrow="Studio Admin" title="Inquiries" />
          <section className="page-section">
            <div className="empty-state">
              <h3>Admin not connected yet</h3>
              <p>
                Connect Supabase to receive brand &amp; publisher inquiries from
                creator profiles.
              </p>
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
  let query = supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (active !== "all") query = query.eq("status", active);
  const { data } = await query;
  const inquiries = (data ?? []) as InquiryRow[];

  return (
    <>
      <Nav />
      <main>
        <PageHeader eyebrow="Studio Admin" title="Inquiries" />
        <section className="page-section">
          <AdminNav active="inquiries" />

          <div className="admin-tabs" style={{ marginTop: "28px" }}>
            {TABS.map((t) => (
              <Link
                key={t}
                href={`/admin/inquiries?status=${t}`}
                className={`filter-chip${active === t ? " active" : ""}`}
              >
                {t}
              </Link>
            ))}
          </div>

          {inquiries.length === 0 ? (
            <div className="empty-state">
              <h3>Nothing here</h3>
              <p>
                Inquiries submitted on creator profiles will appear here for you
                to action.
              </p>
            </div>
          ) : (
            <div className="admin-scroll">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>For creator</th>
                    <th>Message</th>
                    <th>Received</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((q) => {
                    const creator = q.creator_slug
                      ? getCreatorBySlug(q.creator_slug)
                      : undefined;
                    return (
                      <tr key={q.id}>
                        <td>
                          <div className="app-name">{q.name}</div>
                          <div className="app-email">{q.email}</div>
                          {q.company && (
                            <div className="app-email">{q.company}</div>
                          )}
                        </td>
                        <td>{creator?.name ?? q.creator_slug ?? "—"}</td>
                        <td style={{ maxWidth: "340px" }}>{q.message}</td>
                        <td>{fmt(q.created_at)}</td>
                        <td>
                          <div className="row-actions">
                            <a
                              href={`mailto:${q.email}`}
                              className="filter-chip"
                            >
                              Reply
                            </a>
                            <form action={setInquiryStatus}>
                              <input type="hidden" name="id" value={q.id} />
                              <input
                                type="hidden"
                                name="status"
                                value={q.status === "handled" ? "new" : "handled"}
                              />
                              <button type="submit">
                                {q.status === "handled"
                                  ? "Reopen"
                                  : "Mark handled"}
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
