import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import ChapterEditor from "@/components/studio/ChapterEditor";
import BookMeta from "@/components/studio/BookMeta";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, canUseStudio } from "@/lib/auth";
import {
  toChapterSet,
  type ArtifactRow,
  type ChapterSet,
} from "@/lib/anthropic/types";
import { chapterBodyHtml } from "@/lib/book";

export const metadata: Metadata = {
  title: "Book Editor — Golden Shadow Studio",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function BookEditorPage() {
  if (!isSupabaseConfigured) redirect("/dashboard/studio");

  const session = await getSession();
  if (!session) redirect("/login");
  if (!canUseStudio(session)) redirect("/dashboard/studio");

  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_artifacts")
    .select("*")
    .eq("user_id", session.userId)
    .eq("kind", "chapter")
    .maybeSingle();

  const set: ChapterSet = data
    ? toChapterSet((data as ArtifactRow).content)
    : { chapters: [] };
  const chapters = [...set.chapters].sort((a, b) => a.number - b.number);

  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="Studio · Book Editor"
          title={
            <>
              Edit &amp; export your <em>book.</em>
            </>
          }
          subtitle="Refine each chapter in a full editor — format text and insert images. Export the whole book when you're ready."
          breadcrumbs={[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/dashboard/studio", label: "Studio" },
          ]}
        />
        <section className="page-section">
          {chapters.length === 0 ? (
            <div className="empty-state">
              <h3>No chapters yet</h3>
              <p>
                Draft at least one chapter in the Studio Engine, then come back
                here to edit and export your book.
              </p>
              <Link href="/dashboard/studio" className="btn-dark">
                Open the Studio Engine
              </Link>
            </div>
          ) : (
            <>
              <p className="profile-section-label">Cover &amp; title page</p>
              <BookMeta
                userId={session.userId}
                initial={{
                  bookTitle: set.bookTitle,
                  subtitle: set.subtitle,
                  author:
                    set.author ?? session.profile?.full_name ?? undefined,
                  coverUrl: set.coverUrl,
                }}
              />

              <p
                className="profile-section-label"
                style={{ marginTop: "44px" }}
              >
                Export the whole book
              </p>
              <div className="book-export-bar">
                <a className="btn-dark" href="/dashboard/studio/export/docx">
                  Download Word (.docx)
                </a>
                <a
                  className="btn-outline"
                  href="/dashboard/studio/print"
                  target="_blank"
                  rel="noopener"
                >
                  Print / Save as PDF
                </a>
                <a className="btn-outline" href="/dashboard/studio/export/md">
                  Download Markdown
                </a>
              </div>

              {chapters.map((ch) => (
                <div className="book-chapter" key={ch.number}>
                  <div className="book-chapter-head">
                    <p className="book-chapter-label">
                      Chapter {ch.number}
                      {ch.chapterTitle ? ` · ${ch.chapterTitle}` : ""}
                    </p>
                    <div className="chapter-export">
                      <span>Export:</span>
                      <a href={`/dashboard/studio/export/docx?chapter=${ch.number}`}>
                        Word
                      </a>
                      <a
                        href={`/dashboard/studio/print?chapter=${ch.number}`}
                        target="_blank"
                        rel="noopener"
                      >
                        PDF
                      </a>
                      <a href={`/dashboard/studio/export/md?chapter=${ch.number}`}>
                        Markdown
                      </a>
                    </div>
                  </div>
                  <ChapterEditor
                    chapterNumber={ch.number}
                    title={ch.chapterTitle}
                    initialHtml={chapterBodyHtml(ch)}
                    userId={session.userId}
                  />
                </div>
              ))}
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
