import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, isAdmin } from "@/lib/auth";
import { updatePost, deletePost } from "../actions";

export const metadata: Metadata = {
  title: "Edit Article — Golden Shadow Admin",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PostRow = {
  slug: string;
  title: string;
  tag: string | null;
  excerpt: string | null;
  body: string[] | null;
  date: string | null;
  read_time: string | null;
  cover_url: string | null;
  published: boolean;
};

export default async function EditJournalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSupabaseConfigured) redirect("/admin/journal");

  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isAdmin(session)) redirect("/dashboard");

  const supabase = await createClient();
  const { data } = await supabase
    .from("journal_posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  const post = data as PostRow | null;
  if (!post) notFound();

  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="Studio Admin"
          title="Edit Article"
          breadcrumbs={[{ href: "/admin/journal", label: "Journal" }]}
        />
        <section className="page-section">
          <form action={updatePost} className="apply-form" style={{ maxWidth: "720px" }}>
            <input type="hidden" name="slug" value={post.slug} />
            <div className="form-row">
              <div className="form-field">
                <label className="form-label" htmlFor="title">Title *</label>
                <input id="title" name="title" type="text" defaultValue={post.title} required maxLength={160} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="tag">Tag</label>
                <input id="tag" name="tag" type="text" defaultValue={post.tag ?? ""} maxLength={40} />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="excerpt">Excerpt</label>
              <textarea id="excerpt" name="excerpt" rows={2} defaultValue={post.excerpt ?? ""} maxLength={400} />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="cover_url">
                Cover image URL <span className="label-hint">(optional)</span>
              </label>
              <input id="cover_url" name="cover_url" type="url" defaultValue={post.cover_url ?? ""} placeholder="https://…/image.jpg" maxLength={400} />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="body">
                Body <span className="label-hint">(blank line between paragraphs)</span>
              </label>
              <textarea id="body" name="body" rows={10} defaultValue={(post.body ?? []).join("\n\n")} />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label" htmlFor="date">Date label</label>
                <input id="date" name="date" type="text" defaultValue={post.date ?? ""} maxLength={40} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="read_time">Read time</label>
                <input id="read_time" name="read_time" type="text" defaultValue={post.read_time ?? ""} maxLength={40} />
              </div>
            </div>
            <label className="checkbox-row">
              <input type="checkbox" name="published" defaultChecked={post.published} /> Published
            </label>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <button type="submit" className="btn-dark">Save changes</button>
              <Link href={`/journal/${post.slug}`} className="jlink" target="_blank">
                View on site →
              </Link>
            </div>
          </form>

          <form action={deletePost} style={{ marginTop: "32px", maxWidth: "720px" }}>
            <input type="hidden" name="slug" value={post.slug} />
            <button type="submit" className="admin-signout">Delete this article</button>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
