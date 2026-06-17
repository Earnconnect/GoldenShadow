"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, canUseStudio } from "@/lib/auth";
import {
  generateIPBlueprint,
  generateBookArchitecture,
  generateProductSuite,
} from "@/lib/anthropic/engine";
import type {
  ArtifactRow,
  ArtifactKind,
  IPBlueprint,
  StageResult,
  ArtifactContent,
} from "@/lib/anthropic/types";

export type StudioState = {
  status: "idle" | "success" | "error" | "preview";
  message: string;
  artifact?: ArtifactRow;
};

// ── shared helpers ─────────────────────────────────────────────

async function requireCreatorSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

const PLAN_REQUIRED: StudioState = {
  status: "error",
  message:
    "The AI Studio Engine is available on the Studio and Platform plans. Upgrade to continue.",
};

async function loadArtifact(
  userId: string,
  kind: ArtifactKind
): Promise<ArtifactRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_artifacts")
    .select("*")
    .eq("user_id", userId)
    .eq("kind", kind)
    .maybeSingle();
  return (data as ArtifactRow) ?? null;
}

async function upsertArtifact(args: {
  userId: string;
  creatorSlug: string | null;
  kind: ArtifactKind;
  title: string;
  content: ArtifactContent;
  model: string | null;
}): Promise<ArtifactRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_artifacts")
    .upsert(
      {
        user_id: args.userId,
        creator_slug: args.creatorSlug,
        kind: args.kind,
        title: args.title,
        content: args.content,
        model: args.model,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,kind" }
    )
    .select("*")
    .single();
  return (data as ArtifactRow) ?? null;
}

function truncationNote(r: StageResult<ArtifactContent>): string {
  return r.truncated
    ? " (Note: your source material was long and was truncated to stay within limits.)"
    : "";
}

// ── Source material ────────────────────────────────────────────
export async function saveSourceMaterial(
  _prev: StudioState,
  formData: FormData
): Promise<StudioState> {
  if (!isSupabaseConfigured) {
    return { status: "error", message: "Database not connected yet." };
  }
  const session = await requireCreatorSession();
  if (!canUseStudio(session)) return PLAN_REQUIRED;
  const source = String(formData.get("source") ?? "").trim();
  if (source.length < 40) {
    return {
      status: "error",
      message:
        "Add a bit more source material first — at least a few sentences.",
    };
  }
  const artifact = await upsertArtifact({
    userId: session.userId,
    creatorSlug: session.profile?.creator_slug ?? null,
    kind: "source",
    title: "Source material",
    content: { text: source },
    model: null,
  });
  revalidatePath("/dashboard/studio");
  return {
    status: "success",
    message: "Source material saved.",
    artifact: artifact ?? undefined,
  };
}

// ── Generic stage runner ───────────────────────────────────────
async function runStage(
  kind: Exclude<ArtifactKind, "source">,
  title: string,
  produce: (
    sourceText: string,
    userId: string
  ) => Promise<StageResult<ArtifactContent>>
): Promise<StudioState> {
  if (!isSupabaseConfigured) {
    return { status: "error", message: "Database not connected yet." };
  }
  const session = await requireCreatorSession();
  if (!canUseStudio(session)) return PLAN_REQUIRED;

  const sourceRow = await loadArtifact(session.userId, "source");
  const sourceText =
    sourceRow && "text" in sourceRow.content ? sourceRow.content.text : "";
  if (!sourceText || sourceText.trim().length < 40) {
    return {
      status: "error",
      message: "Add and save your source material before generating.",
    };
  }

  let result: StageResult<ArtifactContent>;
  try {
    result = await produce(sourceText, session.userId);
  } catch {
    return {
      status: "error",
      message: "The engine hit a snag generating this. Please try again.",
    };
  }

  const artifact = await upsertArtifact({
    userId: session.userId,
    creatorSlug: session.profile?.creator_slug ?? null,
    kind,
    title,
    content: result.content,
    model: result.model,
  });

  revalidatePath("/dashboard/studio");
  const preview = result.model === "preview";
  return {
    status: preview ? "preview" : "success",
    message:
      (preview
        ? "Preview sample generated (connect the AI engine for real output)."
        : `${title} generated.`) + truncationNote(result),
    artifact: artifact ?? undefined,
  };
}

// ── Stage actions (the chapter stage streams via /api/studio/chapter) ──
export async function runBlueprint(guidance?: string): Promise<StudioState> {
  return runStage("blueprint", "IP Blueprint", (sourceText) =>
    generateIPBlueprint({ sourceText, guidance })
  );
}

export async function runArchitecture(guidance?: string): Promise<StudioState> {
  return runStage("architecture", "Book Architecture", async (sourceText, userId) => {
    const bp = await loadArtifact(userId, "blueprint");
    return generateBookArchitecture({
      sourceText,
      blueprint: bp ? (bp.content as IPBlueprint) : undefined,
      guidance,
    });
  });
}

export async function runProductSuite(guidance?: string): Promise<StudioState> {
  return runStage("product_suite", "Product Suite", async (sourceText, userId) => {
    const bp = await loadArtifact(userId, "blueprint");
    return generateProductSuite({
      sourceText,
      blueprint: bp ? (bp.content as IPBlueprint) : undefined,
      guidance,
    });
  });
}
