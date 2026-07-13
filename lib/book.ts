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

// Title / cover page (empty string if no metadata is set).
export function titlePageHtml(set: ChapterSet): string {
  const title = set.bookTitle?.trim();
  const cover = set.coverUrl?.trim();
  const subtitle = set.subtitle?.trim();
  const author = set.author?.trim();
  if (!title && !cover && !subtitle && !author) return "";

  const parts = ['<section class="title-page" style="text-align:center;">'];
  if (cover)
    parts.push(
      `<p><img src="${cover}" alt="Cover" style="max-width:70%;height:auto;" /></p>`
    );
  if (title)
    parts.push(
      `<h1 style="font-size:34px;margin:24px 0 8px;">${esc(title)}</h1>`
    );
  if (subtitle)
    parts.push(
      `<p style="font-size:18px;color:#555;margin:0 0 8px;">${esc(subtitle)}</p>`
    );
  if (author)
    parts.push(`<p style="margin-top:28px;">by ${esc(author)}</p>`);
  parts.push("</section>");
  return parts.join("\n");
}

export function bookHtml(set: ChapterSet): string {
  const cover = titlePageHtml(set);
  const body = sorted(set).map(chapterHtml).join("\n");
  return (cover ? `${cover}\n` : "") + body;
}

export function singleChapterHtml(set: ChapterSet, n: number): string {
  const ch = set.chapters.find((c) => c.number === n);
  return ch ? chapterHtml(ch) : "";
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
  const head: string[] = [];
  if (set.bookTitle?.trim()) head.push(`# ${set.bookTitle.trim()}`);
  if (set.subtitle?.trim()) head.push(`### ${set.subtitle.trim()}`);
  if (set.author?.trim()) head.push(`_by ${set.author.trim()}_`);
  if (set.coverUrl?.trim()) head.push(`![cover](${set.coverUrl.trim()})`);
  const front = head.length ? `${head.join("\n\n")}\n\n---\n\n` : "";
  return front + sorted(set).map(chapterMarkdown).join("\n\n---\n\n");
}

export function singleChapterMarkdown(set: ChapterSet, n: number): string {
  const ch = set.chapters.find((c) => c.number === n);
  return ch ? chapterMarkdown(ch) : "";
}
