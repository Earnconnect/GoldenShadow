// Server-only helpers that turn a chapter set into HTML / Markdown for export.
// Prefers a chapter's WYSIWYG-edited `html`; falls back to the AI `markdown`.
import { marked } from "marked";
import TurndownService from "turndown";
import type { ChapterSet, ChapterDraft } from "@/lib/anthropic/types";

function esc(s: string): string {
  return String(s ?? "").replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string
  );
}

function sorted(set: ChapterSet): ChapterDraft[] {
  return [...(set.chapters ?? [])].sort(
    (a, b) => (a.number ?? 0) - (b.number ?? 0)
  );
}

function mdToHtml(md: string): string {
  return marked.parse(md || "", { async: false }) as string;
}

// One chapter's body as HTML (edited html wins; else markdown → html).
export function chapterBodyHtml(ch: ChapterDraft): string {
  return ch.html && ch.html.trim() ? ch.html : mdToHtml(ch.markdown || "");
}

export function chapterHtml(ch: ChapterDraft): string {
  const title = ch.chapterTitle || `Chapter ${ch.number}`;
  return `<section class="chapter"><h1>${esc(title)}</h1>\n${chapterBodyHtml(
    ch
  )}</section>`;
}

export function bookHtml(set: ChapterSet): string {
  return sorted(set).map(chapterHtml).join("\n");
}

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

export function chapterMarkdown(ch: ChapterDraft): string {
  const title = ch.chapterTitle || `Chapter ${ch.number}`;
  const body =
    ch.html && ch.html.trim() ? turndown.turndown(ch.html) : ch.markdown || "";
  return `# ${title}\n\n${body}`;
}

export function bookMarkdown(set: ChapterSet): string {
  return sorted(set).map(chapterMarkdown).join("\n\n---\n\n");
}
