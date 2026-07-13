// ─────────────────────────────────────────────────────────────
// Artifact types produced by the Studio Engine. Pure types — safe to import
// from both server (engine, actions) and client (renderers) components.
// ─────────────────────────────────────────────────────────────

export type ArtifactKind =
  | "source"
  | "blueprint"
  | "architecture"
  | "chapter"
  | "product_suite";

// ── Stage 1: IP Blueprint ──────────────────────────────────────
export interface ProductPath {
  name: string;
  format: string;
  description: string;
}

export interface RoadmapPhase {
  months: string; // e.g. "Months 1–3"
  milestone: string;
  activities: string[];
}

export interface IPBlueprint {
  bookConcept: {
    workingTitle: string;
    premise: string;
    targetReader: string;
    positioning: string;
  };
  productPaths: ProductPath[]; // exactly 3
  launchRoadmap: RoadmapPhase[]; // 12-month, phased
}

// ── Stage 2: Book Architecture ─────────────────────────────────
export interface ChapterOutline {
  number: number;
  title: string;
  summary: string;
  keyBeats: string[];
}

export interface BookArchitecture {
  positioning: {
    hook: string;
    promise: string;
    differentiation: string;
    comparableTitles: string[];
  };
  chapters: ChapterOutline[];
}

// ── Stage 3: Sample Chapter Draft ──────────────────────────────
export interface ChapterDraft {
  number: number;
  chapterTitle: string;
  markdown: string;
  wordCountEstimate: number;
  html?: string; // WYSIWYG-edited content; overrides markdown when present
}

// A chapter artifact now holds a *set* of drafted chapters (whole-book drafting)
// plus optional book-level metadata for the title/cover page on export.
export interface ChapterSet {
  chapters: ChapterDraft[];
  bookTitle?: string;
  subtitle?: string;
  author?: string;
  coverUrl?: string;
}

// ── Stage 4: Product Suite ─────────────────────────────────────
export interface ProductIdea {
  type: "playbook" | "workbook" | "merch" | "course";
  name: string;
  description: string;
}

export interface ProductSuite {
  ideas: ProductIdea[];
}

// ── Persistence / transport shapes ─────────────────────────────
export type ReviewStatus = "pending" | "approved" | "needs_work";

export type ArtifactContent =
  | IPBlueprint
  | BookArchitecture
  | ChapterDraft
  | ChapterSet
  | ProductSuite
  | { text: string };

export interface ArtifactRow {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  creator_slug: string | null;
  kind: ArtifactKind;
  title: string;
  content: ArtifactContent;
  model: string | null;
  review_status?: ReviewStatus | null;
  review_note?: string | null;
}

// Normalize a `chapter` artifact's content to a ChapterSet, tolerating the
// legacy single-ChapterDraft shape so old rows keep working.
export function toChapterSet(content: unknown): ChapterSet {
  if (
    content &&
    typeof content === "object" &&
    "chapters" in content &&
    Array.isArray((content as ChapterSet).chapters)
  ) {
    return content as ChapterSet;
  }
  if (content && typeof content === "object" && "markdown" in content) {
    const d = content as ChapterDraft;
    return { chapters: [{ ...d, number: d.number ?? 1 }] };
  }
  return { chapters: [] };
}

// Every engine stage returns this wrapper so the disclaimer can't be dropped.
export interface StageResult<T extends ArtifactContent> {
  content: T;
  model: string;
  disclaimer: string;
  truncated?: boolean;
}
