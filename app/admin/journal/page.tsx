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
import { createPost, deletePost } from "./actions";

export const metadata: Metadata = {
  title: "Journal — Golden Shadow Admin",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PostRow = {
  slug: string;
  title: string;
  tag: string | null;
  published: boolean;
  created_at: string;
};

export default async function AdminJournalPage() {
  if (!isSupabaseConfigured) {
    return (
      <>
        <Nav />
        <main>
          <PageHeader eyebrow="Studio Admin" title="Journal" />
          <section className="page-section">
            <div className="empty-state">
              <h3>Admin not connected yet</h3>
              <p>Connect Supabase to write and publish journal articles in-app.</p>
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
    .from("journal_posts")
    .select("slug, title, tag, published, created_at")
    .order("created_at", { ascending: false });
  const posts = (data ?? []) as PostRow[];

  return (
    <>
      <Nav />
      <main>
        <PageHeader eyebrow="Studio Admin" title="Journal" />
        <section className="page-section">
          <AdminNav active="journal" />

          <p className="profile-section-label" style={{ marginTop: "32px" }}>
            New Article
          </p>
          <form action={createPost} className="apply-form" style={{ maxWidth: "720px" }}>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label" htmlFor="title">Title *</label>
                <input id="title" name="title" type="text" required maxLength={160} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="tag">Tag</label>
                <input id="tag" name="tag" type="text" placeholder="Strategy" maxLength={40} />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="excerpt">Excerpt</label>
              <textarea id="excerpt" name="excerpt" rows={2} maxLength={400} />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="body">
                Body <span className="label-hint">(blank line between paragraphs)</span>
              </label>
              <textarea id="body" name="body" rows={8} />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label" htmlFor="date">Date label</label>
                <input id="date" name="date" type="text" placeholder="June 2026" maxLength={40} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="read_time">Read time</label>
                <input id="read_time" name="read_time" type="text" placeholder="6 min read" maxLength={40} />
              </div>
            </div>
            <label className="checkbox-row">
              <input type="checkbox" name="published" /> Publish immediately
            </label>
            <button type="submit" className="btn-dark">Create article</button>
          </form>

          <p className="profile-section-label" style={{ marginTop: "56px" }}>
            Articles ({posts.length})
          </p>
          {posts.length === 0 ? (
            <p className="form-fineprint">
              No database articles yet. The three built-in articles ship in the
              code; new ones you create here appear on the public journal.
            </p>
          ) : (
            <div className="admin-scroll">
              <table className="app-table">
                <thead>
                  <tr><th>Title</th><th>Tag</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p.slug}>
                      <td><span className="app-name">{p.title}</span></td>
                      <td>{p.tag ?? "—"}</td>
                      <td>
                        <span className={`status-pill status-${p.published ? "approved" : "pending"}`}>
                          {p.published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <Link href={`/admin/journal/${p.slug}`} className="filter-chip">
                            Edit
                          </Link>
                          <form action={deletePost}>
                            <input type="hidden" name="slug" value={p.slug} />
                            <button type="submit" className="decline">Delete</button>
                          </form>
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
