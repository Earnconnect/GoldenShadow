import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession } from "@/lib/auth";
import { toChapterSet, type ArtifactRow } from "@/lib/anthropic/types";
import { bookMarkdown, singleChapterMarkdown } from "@/lib/book";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "not configured" }, { status: 404 });
  }
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_artifacts")
    .select("*")
    .eq("user_id", session.userId)
    .eq("kind", "chapter")
    .maybeSingle();
  const set = data ? toChapterSet((data as ArtifactRow).content) : { chapters: [] };

  const chapterParam = request.nextUrl.searchParams.get("chapter");
  const chapterNum = chapterParam ? Number(chapterParam) : NaN;
  const single = Number.isFinite(chapterNum);
  const md =
    (single ? singleChapterMarkdown(set, chapterNum) : bookMarkdown(set)) ||
    "# Your book\n\n(No chapters yet.)";
  const filename = single ? `chapter-${chapterNum}.md` : "book.md";

  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
