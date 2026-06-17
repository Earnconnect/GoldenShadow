import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic } from "./client";
import {
  ANTHROPIC_MODEL,
  ANTHROPIC_MODEL_HEAVY,
  MAX_SOURCE_CHARS,
} from "./config";
import {
  SYSTEM_PROMPT,
  DISCLAIMER,
  BLUEPRINT_TOOL,
  ARCHITECTURE_TOOL,
  PRODUCT_SUITE_TOOL,
} from "./prompts";
import type {
  IPBlueprint,
  BookArchitecture,
  ChapterDraft,
  ProductSuite,
  StageResult,
  ArtifactContent,
} from "./types";

// ── Helpers ────────────────────────────────────────────────────

function clampSource(sourceText: string): { text: string; truncated: boolean } {
  if (sourceText.length <= MAX_SOURCE_CHARS) {
    return { text: sourceText, truncated: false };
  }
  return { text: sourceText.slice(0, MAX_SOURCE_CHARS), truncated: true };
}

// Append optional creator guidance to a stage instruction.
function withGuidance(instruction: string, guidance?: string): string {
  const g = guidance?.trim();
  if (!g) return instruction;
  return `${instruction}\n\nAdditional guidance from the creator — honor it within the brief above: ${g}`;
}

// System block + cached source material block. The frozen system prompt and the
// source material form the reused prefix across all 4 stages; per-stage
// instructions are appended after so every call hits the cache.
function buildBase(sourceText: string, instruction: string) {
  const system: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text: SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" },
    },
  ];
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `<source_material>\n${sourceText}\n</source_material>`,
          cache_control: { type: "ephemeral" },
        },
        { type: "text", text: instruction },
      ],
    },
  ];
  return { system, messages };
}

// Run a structured stage: force a single tool and return its parsed input.
async function runStructured<T extends ArtifactContent>(
  client: Anthropic,
  model: string,
  sourceText: string,
  instruction: string,
  tool: { name: string; description: string; input_schema: object },
  truncated: boolean
): Promise<StageResult<T>> {
  const { system, messages } = buildBase(sourceText, instruction);
  const response = await client.messages.create({
    model,
    max_tokens: 16000,
    system,
    messages,
    tools: [tool as Anthropic.Tool],
    tool_choice: { type: "tool", name: tool.name },
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Model did not return structured output.");
  }
  return {
    content: toolUse.input as T,
    model: response.model,
    disclaimer: DISCLAIMER,
    truncated,
  };
}

// ── Stage 1: IP Blueprint ──────────────────────────────────────
export async function generateIPBlueprint(args: {
  sourceText: string;
  guidance?: string;
}): Promise<StageResult<IPBlueprint>> {
  const client = getAnthropic();
  if (!client) return cannedBlueprint();
  const { text, truncated } = clampSource(args.sourceText);
  return runStructured<IPBlueprint>(
    client,
    ANTHROPIC_MODEL,
    text,
    withGuidance(
      "Produce this creator's IP Blueprint from the source material above. Give a working book title and premise, exactly three distinct product paths, and a phased 12-month launch roadmap. Call emit_ip_blueprint.",
      args.guidance
    ),
    BLUEPRINT_TOOL,
    truncated
  );
}

// ── Stage 2: Book Architecture ─────────────────────────────────
export async function generateBookArchitecture(args: {
  sourceText: string;
  blueprint?: IPBlueprint;
  guidance?: string;
}): Promise<StageResult<BookArchitecture>> {
  const client = getAnthropic();
  if (!client) return cannedArchitecture();
  const { text, truncated } = clampSource(args.sourceText);
  const blueprintNote = args.blueprint
    ? `\n\nThe approved IP Blueprint to build on:\n${JSON.stringify(
        args.blueprint
      )}`
    : "";
  return runStructured<BookArchitecture>(
    client,
    ANTHROPIC_MODEL_HEAVY,
    text,
    withGuidance(
      `Architect the book: sharpen its positioning and produce a chapter-by-chapter outline grounded in the source material.${blueprintNote} Call emit_book_architecture.`,
      args.guidance
    ),
    ARCHITECTURE_TOOL,
    truncated
  );
}

// ── Stage 3: Sample Chapter Draft (streamed long-form prose) ───

// Build the request for the chapter stage. Shared by the non-streaming
// draftChapter() and the streaming /api/studio/chapter route so the prompt and
// caching are identical either way.
export function buildChapterRequest(args: {
  sourceText: string;
  architecture?: BookArchitecture;
  chapterNumber?: number;
  guidance?: string;
}): {
  model: string;
  max_tokens: number;
  system: Anthropic.TextBlockParam[];
  messages: Anthropic.MessageParam[];
  chapterTitle: string;
  chapterNumber: number;
  truncated: boolean;
} {
  const { text, truncated } = clampSource(args.sourceText);
  const chapter =
    args.architecture?.chapters.find(
      (c) => c.number === (args.chapterNumber ?? 1)
    ) ?? args.architecture?.chapters[0];
  const chapterNote = chapter
    ? `Draft Chapter ${chapter.number}: "${chapter.title}".\nChapter summary: ${
        chapter.summary
      }\nKey beats to land: ${chapter.keyBeats.join("; ")}`
    : "Draft an opening sample chapter that best represents this book.";
  const instruction = withGuidance(
    `${chapterNote}\n\nWrite a polished long-form chapter in the creator's voice, grounded in the source material. Use clean Markdown (a single # title, ## subheads, prose paragraphs). Aim for 1,200-2,000 words. Output only the chapter Markdown — no preamble or commentary.`,
    args.guidance
  );

  const { system, messages } = buildBase(text, instruction);
  return {
    model: ANTHROPIC_MODEL_HEAVY,
    max_tokens: 64000,
    system,
    messages,
    chapterTitle: chapter?.title ?? "Sample Chapter",
    chapterNumber: chapter?.number ?? args.chapterNumber ?? 1,
    truncated,
  };
}

// Wrap raw chapter Markdown into a ChapterDraft.
export function chapterFromMarkdown(
  markdown: string,
  fallbackTitle: string,
  chapterNumber = 1
): ChapterDraft {
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  return {
    number: chapterNumber,
    chapterTitle:
      fallbackTitle !== "Sample Chapter"
        ? fallbackTitle
        : (titleMatch?.[1] ?? "Sample Chapter"),
    markdown,
    wordCountEstimate: markdown.split(/\s+/).filter(Boolean).length,
  };
}

export async function draftChapter(args: {
  sourceText: string;
  architecture?: BookArchitecture;
  chapterNumber?: number;
  guidance?: string;
}): Promise<StageResult<ChapterDraft>> {
  const client = getAnthropic();
  if (!client) return cannedChapter();
  const req = buildChapterRequest(args);

  // Streaming keeps the SDK transport from timing out on a long generation.
  const stream = client.messages.stream({
    model: req.model,
    max_tokens: req.max_tokens,
    thinking: { type: "adaptive" },
    system: req.system,
    messages: req.messages,
  });
  const final = await stream.finalMessage();

  const markdown = final.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return {
    content: chapterFromMarkdown(markdown, req.chapterTitle, req.chapterNumber),
    model: final.model,
    disclaimer: DISCLAIMER,
    truncated: req.truncated,
  };
}

// ── Stage 4: Product Suite ─────────────────────────────────────
export async function generateProductSuite(args: {
  sourceText: string;
  blueprint?: IPBlueprint;
  guidance?: string;
}): Promise<StageResult<ProductSuite>> {
  const client = getAnthropic();
  if (!client) return cannedProductSuite();
  const { text, truncated } = clampSource(args.sourceText);
  const blueprintNote = args.blueprint
    ? `\n\nThe approved IP Blueprint for context:\n${JSON.stringify(
        args.blueprint
      )}`
    : "";
  return runStructured<ProductSuite>(
    client,
    ANTHROPIC_MODEL,
    text,
    withGuidance(
      `Design a product suite that extends this IP beyond the book — playbooks, workbooks, merch, and/or a course.${blueprintNote} Call emit_product_suite.`,
      args.guidance
    ),
    PRODUCT_SUITE_TOOL,
    truncated
  );
}

// ── Canned fixtures (preview mode, no API key) ─────────────────
// Realistic samples so the full flow is demoable without a key. Must satisfy
// the same artifact types as real output (compile-time parity).

const PREVIEW_MODEL = "preview";

export function cannedBlueprint(): StageResult<IPBlueprint> {
  return {
    model: PREVIEW_MODEL,
    disclaimer: DISCLAIMER,
    content: {
      bookConcept: {
        workingTitle: "The Category Architect",
        premise:
          "Most leaders compete inside categories someone else defined. This book lays out a repeatable method for naming, framing, and owning a new category — turning a founder's hard-won frameworks into a defensible market position.",
        targetReader:
          "Founders, operators, and executives building category-defining companies who already have a point of view but haven't codified it.",
        positioning:
          "Practitioner-built, not theory. Where most positioning books stop at messaging, this one connects category design to product, GTM, and narrative.",
      },
      productPaths: [
        {
          name: "Positioning Playbook",
          format: "Playbook",
          description:
            "A step-by-step companion that turns the book's frameworks into worksheets a team can run in a single offsite.",
        },
        {
          name: "Category Sprint",
          format: "Workshop",
          description:
            "A facilitated two-day workshop format the author can license or run for executive teams.",
        },
        {
          name: "Founder Story Studio",
          format: "Course",
          description:
            "A self-paced course teaching founders to tell the origin story that anchors a new category.",
        },
      ],
      launchRoadmap: [
        {
          months: "Months 1-3",
          milestone: "Manuscript and positioning locked",
          activities: [
            "IP audit and concept session",
            "Chapter architecture approved",
            "Sample chapter drafted",
          ],
        },
        {
          months: "Months 4-7",
          milestone: "Production",
          activities: [
            "Full draft and developmental edit",
            "Design and typesetting",
            "Playbook companion built",
          ],
        },
        {
          months: "Months 8-9",
          milestone: "Pre-launch",
          activities: [
            "Media kit and Amazon listing",
            "Advance reader copies",
            "Workshop pilot",
          ],
        },
        {
          months: "Months 10-12",
          milestone: "Launch and compound",
          activities: [
            "Book launch",
            "Course pre-sale",
            "Speaking and partnership outreach",
          ],
        },
      ],
    },
  };
}

export function cannedArchitecture(): StageResult<BookArchitecture> {
  return {
    model: PREVIEW_MODEL,
    disclaimer: DISCLAIMER,
    content: {
      positioning: {
        hook: "The companies that win don't play the game better — they change which game is being played.",
        promise:
          "By the end, the reader can name, frame, and stake a claim to a category they are positioned to own.",
        differentiation:
          "Connects category design to the operating decisions most positioning books ignore.",
        comparableTitles: [
          "Play Bigger",
          "Obviously Awesome",
          "Crossing the Chasm",
        ],
      },
      chapters: [
        {
          number: 1,
          title: "The Category Trap",
          summary:
            "Why competing inside an inherited category caps your ceiling, and what it costs.",
          keyBeats: [
            "Categories are inherited by default",
            "The cost of being a 'better' option",
            "The reframe: design the category",
          ],
        },
        {
          number: 2,
          title: "Finding the Wedge",
          summary:
            "How to locate the tension in the market that a new category resolves.",
          keyBeats: [
            "Listen for the language of frustration",
            "Name the old game",
            "Define the new game",
          ],
        },
        {
          number: 3,
          title: "Naming the Thing",
          summary: "The craft of a category name that travels.",
          keyBeats: [
            "Names as cognitive shortcuts",
            "Tests for a durable name",
            "Common naming failures",
          ],
        },
      ],
    },
  };
}

export function cannedChapter(): StageResult<ChapterDraft> {
  const markdown = `# The Category Trap

Every market arrives with a map already drawn. By the time you enter, the roads have names, the borders are settled, and the question on the table is which of the existing destinations you'd like to be a slightly better version of.

That map is a trap.

When you accept a category someone else defined, you accept their criteria for what "good" means — and you spend the rest of your life competing on a scorecard you didn't design. The leader sets the terms. Everyone else negotiates discounts.

## The Cost of Being "Better"

Being the better option sounds like a strategy. It isn't. It's a position that depends entirely on a comparison the buyer was already going to make — and comparisons are where margin goes to die.

The alternative is not to compete harder. It's to change which game is being played.

## The Reframe

This book is about that reframe: how to name, frame, and stake a claim to a category you are positioned to own. Not through louder messaging, but through the quiet, deliberate work of designing the terms of the conversation before anyone else shows up to have it.

*(This is a preview sample. Connect the AI engine to generate a full draft from your own material.)*`;
  return {
    model: PREVIEW_MODEL,
    disclaimer: DISCLAIMER,
    content: {
      number: 1,
      chapterTitle: "The Category Trap",
      markdown,
      wordCountEstimate: markdown.split(/\s+/).filter(Boolean).length,
    },
  };
}

export function cannedProductSuite(): StageResult<ProductSuite> {
  return {
    model: PREVIEW_MODEL,
    disclaimer: DISCLAIMER,
    content: {
      ideas: [
        {
          type: "playbook",
          name: "The Positioning Playbook",
          description:
            "A worksheet-driven companion that turns each chapter into a team exercise.",
        },
        {
          type: "workbook",
          name: "Category Design Workbook",
          description:
            "A printable workbook guiding a founder through naming and framing their category.",
        },
        {
          type: "course",
          name: "Founder Story Studio",
          description:
            "A self-paced video course on telling the origin story that anchors a category.",
        },
        {
          type: "merch",
          name: "'Change the Game' Field Notes",
          description:
            "A premium notebook line carrying the book's central idea into daily use.",
        },
      ],
    },
  };
}
