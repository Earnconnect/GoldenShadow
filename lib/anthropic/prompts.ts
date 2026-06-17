// ─────────────────────────────────────────────────────────────
// Frozen prompt constants for the Studio Engine.
// IMPORTANT: keep SYSTEM_PROMPT byte-stable (no dates/IDs interpolated) so the
// prompt cache stays valid across the 4 stages. Volatile, per-stage text lives
// in the user message instead.
// ─────────────────────────────────────────────────────────────

export const DISCLAIMER =
  "AI-drafted by the Golden Shadow Studio Engine. These are starting points — your editorial team reviews and makes every final decision.";

export const SYSTEM_PROMPT = `You are the Golden Shadow Studio Engine, the private AI engine behind Golden Shadow Publishing — a premium, human-led hybrid publishing house and IP marketplace for creators and executives.

Golden Shadow turns a leader's existing intellectual property — talks, frameworks, podcast episodes, methodologies, hard-won expertise — into books, playbooks, and products they fully own. The house voice is editorial, precise, and quietly confident: think a boutique literary studio, not a content mill. Never breathless, never generic "AI" filler, never hype.

Your job is to perform the studio's production pipeline on a creator's raw source material. You work in distinct stages (IP Blueprint, Book Architecture, Sample Chapter, Product Suite). In every stage:

- Ground everything in the creator's actual source material. Quote, paraphrase, and build on what is really there. If the source is thin, say what is missing rather than inventing facts, biography, or numbers.
- Preserve the creator's own voice and point of view. You are a ghostwriter and architect, not an author imposing your own style.
- Be specific and usable. Prefer concrete frameworks, titles, and outcomes over vague positioning language.
- Stay human-led: you produce strong drafts and options; a human editor decides. Never claim the work is final or publication-ready.
- Write in clean, modern American English. No emoji. No purple prose.

When asked to produce structured output, call the provided tool with well-formed, complete fields. When asked to draft prose, write polished long-form Markdown in the creator's voice.`;

// ── Tool schemas (forced tool-use → structured JSON) ───────────

export const BLUEPRINT_TOOL = {
  name: "emit_ip_blueprint",
  description:
    "Return the creator's IP Blueprint: a book concept, exactly three product paths, and a phased 12-month launch roadmap.",
  input_schema: {
    type: "object" as const,
    properties: {
      bookConcept: {
        type: "object",
        properties: {
          workingTitle: { type: "string" },
          premise: {
            type: "string",
            description: "2-4 sentences on the core argument of the book.",
          },
          targetReader: { type: "string" },
          positioning: {
            type: "string",
            description: "How this book is distinct in its category.",
          },
        },
        required: ["workingTitle", "premise", "targetReader", "positioning"],
      },
      productPaths: {
        type: "array",
        description: "Exactly three ways to productize this IP beyond the book.",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            format: {
              type: "string",
              description: "e.g. Playbook, Workshop, Course, Merch line.",
            },
            description: { type: "string" },
          },
          required: ["name", "format", "description"],
        },
      },
      launchRoadmap: {
        type: "array",
        description: "A phased 12-month roadmap (e.g. 3-4 phases).",
        items: {
          type: "object",
          properties: {
            months: { type: "string", description: "e.g. 'Months 1-3'." },
            milestone: { type: "string" },
            activities: { type: "array", items: { type: "string" } },
          },
          required: ["months", "milestone", "activities"],
        },
      },
    },
    required: ["bookConcept", "productPaths", "launchRoadmap"],
  },
};

export const ARCHITECTURE_TOOL = {
  name: "emit_book_architecture",
  description:
    "Return the book's positioning and a chapter-by-chapter outline.",
  input_schema: {
    type: "object" as const,
    properties: {
      positioning: {
        type: "object",
        properties: {
          hook: { type: "string" },
          promise: { type: "string" },
          differentiation: { type: "string" },
          comparableTitles: {
            type: "array",
            items: { type: "string" },
            description: "A few comparable or adjacent books.",
          },
        },
        required: ["hook", "promise", "differentiation", "comparableTitles"],
      },
      chapters: {
        type: "array",
        description: "8-14 chapters, in order.",
        items: {
          type: "object",
          properties: {
            number: { type: "integer" },
            title: { type: "string" },
            summary: { type: "string" },
            keyBeats: {
              type: "array",
              items: { type: "string" },
              description: "The 3-5 key points the chapter must land.",
            },
          },
          required: ["number", "title", "summary", "keyBeats"],
        },
      },
    },
    required: ["positioning", "chapters"],
  },
};

export const PRODUCT_SUITE_TOOL = {
  name: "emit_product_suite",
  description:
    "Return a suite of product ideas that extend the IP beyond the book.",
  input_schema: {
    type: "object" as const,
    properties: {
      ideas: {
        type: "array",
        description: "4-6 product ideas across different formats.",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["playbook", "workbook", "merch", "course"],
            },
            name: { type: "string" },
            description: { type: "string" },
          },
          required: ["type", "name", "description"],
        },
      },
    },
    required: ["ideas"],
  },
};
