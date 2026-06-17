// Single source of truth for whether the AI engine (Anthropic) is wired up.
// Mirrors lib/supabase/config.ts and lib/stripe.ts: a bare boolean + defaults,
// no SDK import here so this stays safe to read anywhere.

export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";

export const isAnthropicConfigured = ANTHROPIC_API_KEY.length > 0;

// Default model for most stages; configurable via env.
export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

// Heavier model for the most leverage-heavy stages (architecture, chapter).
export const ANTHROPIC_MODEL_HEAVY =
  process.env.ANTHROPIC_MODEL_HEAVY ?? "claude-opus-4-8";

// Cap source material sent to the model to control cost/latency. We surface a
// visible notice when we truncate (never silently).
export const MAX_SOURCE_CHARS = 180_000;
