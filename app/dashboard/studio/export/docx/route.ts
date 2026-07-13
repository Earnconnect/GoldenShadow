import { NextResponse } from "next/server";
import HTMLtoDOCX from "@turbodocx/html-to-docx";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession } from "@/lib/auth";
import { toChapterSet, type ArtifactRow } from "@/lib/anthropic/types";
import { bookHtml } from "@/lib/book";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
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

  if (!set.chapters.length) {
    return NextResponse.json({ error: "no chapters" }, { status: 400 });
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${bookHtml(
    set
  )}</body></html>`;

  const buffer = (await HTMLtoDOCX(html, undefined, {
    title: "Golden Shadow — Book",
    orientation: "portrait",
  })) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="book.docx"',
    },
  });
}
