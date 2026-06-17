import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import AdminNav from "@/components/AdminNav";
import ArtifactBlueprint from "@/components/studio/ArtifactBlueprint";
import ArtifactArchitecture from "@/components/studio/ArtifactArchitecture";
import ChapterSet from "@/components/studio/ChapterSet";
import ArtifactProductSuite from "@/components/studio/ArtifactProductSuite";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, isAdmin } from "@/lib/auth";
import { getCreatorBySlug } from "@/lib/data";
import { setArtifactReview } from "./actions";
import type {
  ArtifactRow,
  ArtifactKind,
  IPBlueprint,
  BookArchitecture,
  ProductSuite,
} from "@/lib/anthropic/types";

export const metadata: Metadata = {
  title: "Studio Artifacts — Golden Shadow Admin",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAGE_ORDER: ArtifactKind[] = [
  "blueprint",
  "architecture",
  "chapter",
  "product_suite",
];
const STAGE_LABEL: Record<string, string> = {
  blueprint: "IP Blueprint",
  architecture: "Book Architecture",
  chapter: "Sample Chapter",
  product_suite: "Product Suite",
};

const REVIEW_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  needs_work: "Needs work",
};

function renderArtifact(a: ArtifactRow) {
  switch (a.kind) {
    case "blueprint":
      return <ArtifactBlueprint data={a.content as IPBlueprint} />;
    case "architecture":
      return <ArtifactArchitecture data={a.content as BookArchitecture} />;
    case "chapter":
      return <ChapterSet content={a.content} />;
    case "product_suite":
      return <ArtifactProductSuite data={a.content as ProductSuite} />;
    default:
      return null;
  }
}

export default async function AdminStudioPage() {
  if (!isSupabaseConfigured) {
    return (
      <>
        <Nav />
        <main>
          <PageHeader eyebrow="Studio Admin" title="Studio Artifacts" />
          <section className="page-section">
            <div className="empty-state">
              <h3>Admin not connected yet</h3>
              <p>
                Once Supabase and the AI engine are connected, every creator&apos;s
                AI-generated blueprint, architecture, chapter, and product suite
                appears here for editorial review.
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
  const { data } = await supabase
    .from("ai_artifacts")
    .select("*")
    .neq("kind", "source")
    .order("updated_at", { ascending: false });
  const artifacts = (data ?? []) as ArtifactRow[];

  // Group by creator (user_id); keep most-recent activity first.
  const groups = new Map<string, ArtifactRow[]>();
  for (const a of artifacts) {
    const arr = groups.get(a.user_id) ?? [];
    arr.push(a);
    groups.set(a.user_id, arr);
  }

  return (
    <>
      <Nav />
      <main>
        <PageHeader eyebrow="Studio Admin" title="Studio Artifacts" />
        <section className="page-section">
          <AdminNav active="studio" />

          <p className="result-count" style={{ marginTop: "28px" }}>
            {groups.size} {groups.size === 1 ? "creator" : "creators"} with
            generated work
          </p>

          {groups.size === 0 ? (
            <div className="empty-state">
              <h3>No artifacts yet</h3>
              <p>
                When creators run the Studio Engine, their generated work lands
                here for your editorial team to review.
              </p>
            </div>
          ) : (
            <div className="admin-studio-groups">
              {[...groups.entries()].map(([userId, items]) => {
                const slug = items[0]?.creator_slug ?? null;
                const creator = slug ? getCreatorBySlug(slug) : undefined;
                const name = creator?.name ?? slug ?? "Unlinked creator";
                const ordered = [...items].sort(
                  (a, b) =>
                    STAGE_ORDER.indexOf(a.kind) - STAGE_ORDER.indexOf(b.kind)
                );
                return (
                  <div className="admin-studio-creator" key={userId}>
                    <div className="admin-studio-creator-head">
                      <h3>{name}</h3>
                      <span className="result-count" style={{ margin: 0 }}>
                        {items.length}{" "}
                        {items.length === 1 ? "artifact" : "artifacts"}
                      </span>
                    </div>
                    {ordered.map((a) => (
                      <details className="admin-artifact" key={a.id}>
                        <summary>
                          {STAGE_LABEL[a.kind] ?? a.kind}
                          {a.review_status && (
                            <span
                              className={`status-pill status-${
                                a.review_status === "approved"
                                  ? "approved"
                                  : a.review_status === "needs_work"
                                    ? "declined"
                                    : "pending"
                              }`}
                              style={{ marginLeft: "auto" }}
                            >
                              {REVIEW_LABEL[a.review_status] ?? a.review_status}
                            </span>
                          )}
                          <span className="admin-artifact-meta">
                            {a.model === "preview" ? "preview" : a.model}
                          </span>
                        </summary>
                        <div className="admin-artifact-body">
                          {renderArtifact(a)}

                          <form
                            action={setArtifactReview}
                            className="review-form"
                          >
                            <input type="hidden" name="id" value={a.id} />
                            <textarea
                              name="note"
                              rows={2}
                              placeholder="Editorial note for the creator (optional)…"
                              defaultValue={a.review_note ?? ""}
                            />
                            <div className="review-actions">
                              <button
                                type="submit"
                                name="status"
                                value="approved"
                                className="approve"
                              >
                                Approve
                              </button>
                              <button
                                type="submit"
                                name="status"
                                value="needs_work"
                                className="decline"
                              >
                                Needs work
                              </button>
                              <button
                                type="submit"
                                name="status"
                                value="pending"
                              >
                                Reset
                              </button>
                            </div>
                          </form>
                        </div>
                      </details>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
