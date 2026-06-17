import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import AdminNav from "@/components/AdminNav";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, isAdmin } from "@/lib/auth";
import { getAllCreators } from "@/lib/creators-db";
import { toggleFeatured } from "./actions";

export const metadata: Metadata = {
  title: "Creators — Golden Shadow Admin",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminCreatorsPage() {
  if (!isSupabaseConfigured) {
    return (
      <>
        <Nav />
        <main>
          <PageHeader eyebrow="Studio Admin" title="Creators" />
          <section className="page-section">
            <div className="empty-state">
              <h3>Admin not connected yet</h3>
              <p>Connect Supabase to manage and feature the creator roster.</p>
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

  const creators = await getAllCreators();

  return (
    <>
      <Nav />
      <main>
        <PageHeader eyebrow="Studio Admin" title="Creators" />
        <section className="page-section">
          <AdminNav active="creators" />

          <div className="admin-bar" style={{ marginTop: "28px" }}>
            <p className="result-count" style={{ margin: 0 }}>
              {creators.length} creators
            </p>
            <Link href="/admin/creators/new" className="btn-dark">
              + Add creator
            </Link>
          </div>

          <div className="admin-scroll">
            <table className="app-table">
              <thead>
                <tr><th>Creator</th><th>Category</th><th>Featured</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {creators.map((c) => (
                  <tr key={c.slug}>
                    <td>
                      <div className="app-name">{c.name}</div>
                      <div className="app-email">{c.role}</div>
                    </td>
                    <td>{c.tag || "—"}</td>
                    <td>
                      <form action={toggleFeatured}>
                        <input type="hidden" name="slug" value={c.slug} />
                        <input
                          type="hidden"
                          name="featured"
                          value={(!c.featured).toString()}
                        />
                        <button
                          type="submit"
                          className={`filter-chip${c.featured ? " active" : ""}`}
                        >
                          {c.featured ? "★ Featured" : "☆ Feature"}
                        </button>
                      </form>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link href={`/admin/creators/${c.slug}`} className="filter-chip">
                          Edit
                        </Link>
                        <Link href={`/creators/${c.slug}`} className="filter-chip" target="_blank">
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="form-fineprint" style={{ marginTop: "20px" }}>
            Built-in roster creators become editable here the first time you save
            them (a database record is created). “Feature” works once a creator
            has a saved record.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
