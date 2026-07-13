import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession } from "@/lib/auth";
import { toChapterSet, type ArtifactRow } from "@/lib/anthropic/types";
import { chapterHtml, titlePageHtml } from "@/lib/book";

export const metadata: Metadata = {
  title: "Print — Your Book Draft",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function StudioPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/dashboard/studio");
  const session = await getSession();
  if (!session) redirect("/login");

  const { chapter } = await searchParams;
  const only = chapter ? Number(chapter) : NaN;
  const single = Number.isFinite(only);

  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_artifacts")
    .select("*")
    .eq("user_id", session.userId)
    .eq("kind", "chapter")
    .maybeSingle();
  const row = data as ArtifactRow | null;
  const set = toChapterSet(row?.content);
  const cover = single ? "" : titlePageHtml(set);
  const chapters = [...set.chapters]
    .sort((a, b) => a.number - b.number)
    .filter((c) => !single || c.number === only);

  return (
    <div className="print-doc">
      <div className="print-toolbar">
        <Link href="/dashboard/studio/book" className="btn-outline">
          ← Back to Book Editor
        </Link>
        <p className="print-hint">Use your browser&apos;s Print → Save as PDF.</p>
      </div>

      {cover && (
        <div
          className="print-title-page"
          dangerouslySetInnerHTML={{ __html: cover }}
        />
      )}

      {chapters.length === 0 ? (
        <p>No chapters drafted yet. Draft a chapter in the Studio Engine first.</p>
      ) : (
        chapters.map((c) => (
          <article className="print-chapter" key={c.number}>
            <div
              className="chapter-prose"
              dangerouslySetInnerHTML={{ __html: chapterHtml(c) }}
            />
          </article>
        ))
      )}

      <p className="print-disclaimer">
        AI-drafted by the Golden Shadow Studio Engine — reviewed and finalized by
        the editorial team.
      </p>
    </div>
  );
}
