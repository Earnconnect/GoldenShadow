# Connecting the AI Studio Engine (Phase 6)

The Studio Engine turns a creator's raw material (pasted text + uploaded
`.txt/.md/.docx/.pdf`) into their **IP Blueprint**, **Book Architecture**,
**Sample Chapter**, and **Product Suite** — the studio's publishing pipeline,
run by Claude.

It lives in the creator dashboard at **`/dashboard/studio`**. Until you add an
Anthropic API key it runs in **preview mode**: uploads and the full UI work, and
each stage returns a realistic *canned* sample so you can demo the flow.

## 1. Prerequisites
- Supabase connected and `supabase/schema.sql` run (the schema now includes the
  `ai_artifacts` table the engine saves to). See `SUPABASE_SETUP.md`.
- A creator account that's signed in (the engine is per-creator).

## 2. Get an Anthropic API key
1. Go to https://console.anthropic.com → **API keys** → create a key.
2. Add billing / credits to the account.

## 3. Add the key
In `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
# optional overrides (defaults shown):
ANTHROPIC_MODEL=claude-sonnet-4-6
ANTHROPIC_MODEL_HEAVY=claude-opus-4-8
```
Restart `npm run dev`. The "preview" labels disappear and stages call Claude.

## 4. Use it
1. Sign in, open `/dashboard/studio`.
2. Paste source material and/or upload files — the text lands in the editor.
   Click **Save source material**.
3. Run the stages in order: **IP Blueprint → Book Architecture → Sample Chapter
   → Product Suite**. Each result is saved and can be regenerated.

## How it works (for future devs)
- Shared engine: `lib/anthropic/engine.ts` — one function per stage. Structured
  stages use forced tool-use for clean JSON; the chapter streams long-form
  Markdown. The system prompt + source material are prompt-cached so the four
  stages share the cached prefix (cheaper/faster).
- Models: `claude-sonnet-4-6` for lighter stages, `claude-opus-4-8` for
  architecture + chapter. Override via env.
- Cost control: source material is capped at 180k chars with a visible "source
  truncated" notice (never silent).
- Persistence: `ai_artifacts` table, owner-only via RLS (admins can read all).
- Models page / deployment: the chapter stage can take 30–60s. On Vercel, the
  studio route/actions set `maxDuration = 300` — that needs a Pro plan; Hobby
  caps function duration lower.

## Security
- `ANTHROPIC_API_KEY` is **server-only** — never exposed to the browser, never
  committed (`.env.local` is gitignored). Don't paste it into chat or client code.
