import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY, isAnthropicConfigured } from "./config";

// Lazily-created Anthropic client. Returns null when not configured so callers
// can fall back to preview mode instead of throwing at import time.
// Server-only — never import this into a client component.
let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic | null {
  if (!isAnthropicConfigured) return null;
  if (!_client) {
    _client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  }
  return _client;
}
