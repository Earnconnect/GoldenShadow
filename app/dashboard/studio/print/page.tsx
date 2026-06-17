import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession } from "@/lib/auth";
import { toChapterSet, type ArtifactRow } from "@/lib/anthropic/types";

export const metadata: Metadata = {
  title: "Print — Your Book Draft",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function StudioPrintPage() {
  if (!isSupabaseConfigured) redirect("/dashboard/studio");
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_artifacts")
    .select("*")
    .eq("user_id", session.userId)
    .eq("kind", "chapter")
    .maybeSingle();
  const row = data as ArtifactRow | null;
  const set = toChapterSet(row?.content);

  return (
    <div className="print-doc">
      <div className="print-toolbar">
        <Link href="/dashboard/studio" className="btn-outline">
          ← Back to Studio
        </Link>
        <p className="print-hint">Use your browser&apos;s Print → Save as PDF.</p>
      </div>

      {set.chapters.length === 0 ? (
        <p>No chapters drafted yet. Draft a chapter in the Studio Engine first.</p>
      ) : (
        set.chapters.map((c) => (
          <article className="print-chapter" key={c.number}>
            <div className="chapter-prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {c.markdown}
              </ReactMarkdown>
            </div>
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
