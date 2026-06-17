import { type NextRequest, NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic } from "@/lib/anthropic/client";
import { isAnthropicConfigured } from "@/lib/anthropic/config";
import {
  buildChapterRequest,
  chapterFromMarkdown,
  cannedChapter,
} from "@/lib/anthropic/engine";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, canUseStudio } from "@/lib/auth";
import {
  toChapterSet,
  type ArtifactRow,
  type BookArchitecture,
  type ChapterDraft,
} from "@/lib/anthropic/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // Optional body: which chapter to draft + free-text guidance.
  let chapterNumber = 1;
  let guidance: string | undefined;
  try {
    const body = await request.json();
    if (body && typeof body.chapterNumber === "number") {
      chapterNumber = body.chapterNumber;
    }
    if (body && typeof body.guidance === "string") guidance = body.guidance;
  } catch {
    // no/invalid body → defaults
  }

  // Auth + load source/architecture from the signed-in creator's saved work.
  let userId: string | null = null;
  let creatorSlug: string | null = null;
  let sourceText = "";
  let architecture: BookArchitecture | undefined;

  if (isSupabaseConfigured) {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }
    if (!canUseStudio(session)) {
      return NextResponse.json(
        { error: "The Studio Engine is available on the Studio and Platform plans." },
        { status: 403 }
      );
    }
    userId = session.userId;
    creatorSlug = session.profile?.creator_slug ?? null;

    const supabase = await createClient();
    const { data } = await supabase
      .from("ai_artifacts")
      .select("*")
      .eq("user_id", userId)
      .in("kind", ["source", "architecture"]);
    const rows = (data ?? []) as ArtifactRow[];
    const source = rows.find((r) => r.kind === "source");
    sourceText =
      source && "text" in source.content ? source.content.text : "";
    const arch = rows.find((r) => r.kind === "architecture");
    architecture = arch ? (arch.content as BookArchitecture) : undefined;

    if (!sourceText || sourceText.trim().length < 40) {
      return NextResponse.json(
        { error: "Add and save your source material first." },
        { status: 400 }
      );
    }
  }

  const encoder = new TextEncoder();
  const client = getAnthropic();

  // Preview / safety: stream the canned sample when the engine isn't connected
  // OR there's no usable source material (never spend tokens on an empty call).
  if (!isAnthropicConfigured || !client || sourceText.trim().length < 40) {
    const draft = { ...cannedChapter().content, number: chapterNumber };
    if (userId && isSupabaseConfigured) {
      await persistChapter(userId, creatorSlug, draft);
    }
    return new Response(streamString(draft.markdown, encoder), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  const req = buildChapterRequest({
    sourceText,
    architecture,
    chapterNumber,
    guidance,
  });

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        const stream = client.messages.stream({
          model: req.model,
          max_tokens: req.max_tokens,
          thinking: { type: "adaptive" },
          system: req.system,
          messages: req.messages,
        });
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            full += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const finalMsg: Anthropic.Message = await stream.finalMessage();
        if (userId) {
          const draft = chapterFromMarkdown(
            full.trim(),
            req.chapterTitle,
            req.chapterNumber
          );
          await persistChapter(userId, creatorSlug, draft, finalMsg.model);
        }
      } catch {
        controller.enqueue(
          encoder.encode(
            "\n\n*(The draft was interrupted. Please try regenerating.)*"
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// Merge a drafted chapter into the creator's chapter set (upsert by number).
async function persistChapter(
  userId: string,
  creatorSlug: string | null,
  draft: ChapterDraft,
  model = "preview"
) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("ai_artifacts")
    .select("content")
    .eq("user_id", userId)
    .eq("kind", "chapter")
    .maybeSingle();

  const set = toChapterSet(existing?.content);
  const idx = set.chapters.findIndex((c) => c.number === draft.number);
  if (idx >= 0) set.chapters[idx] = draft;
  else set.chapters.push(draft);
  set.chapters.sort((a, b) => a.number - b.number);

  await supabase.from("ai_artifacts").upsert(
    {
      user_id: userId,
      creator_slug: creatorSlug,
      kind: "chapter",
      title: "Book Chapters",
      content: set,
      model,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,kind" }
  );
}

// Emit a string as a single-chunk stream (preview mode).
function streamString(text: string, encoder: TextEncoder) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}
