// Pure Markdown serializers for Studio artifacts. No DOM / no server deps —
// safe to import from client components for in-browser downloads.

import {
  toChapterSet,
  type ArtifactKind,
  type ArtifactContent,
  type IPBlueprint,
  type BookArchitecture,
  type ProductSuite,
} from "@/lib/anthropic/types";

export function blueprintToMarkdown(b: IPBlueprint): string {
  const lines: string[] = [
    "# IP Blueprint",
    "",
    `## ${b.bookConcept.workingTitle}`,
    "",
    b.bookConcept.premise,
    "",
    `**Target reader.** ${b.bookConcept.targetReader}`,
    "",
    `**Positioning.** ${b.bookConcept.positioning}`,
    "",
    "## Product Paths",
    "",
  ];
  b.productPaths.forEach((p) => {
    lines.push(`- **${p.name}** (${p.format}) — ${p.description}`);
  });
  lines.push("", "## 12-Month Launch Roadmap", "");
  b.launchRoadmap.forEach((ph) => {
    lines.push(`### ${ph.months} — ${ph.milestone}`);
    ph.activities.forEach((a) => lines.push(`- ${a}`));
    lines.push("");
  });
  return lines.join("\n").trim() + "\n";
}

export function architectureToMarkdown(a: BookArchitecture): string {
  const lines: string[] = [
    "# Book Architecture",
    "",
    "## Positioning",
    "",
    `**Hook.** ${a.positioning.hook}`,
    "",
    `**Promise.** ${a.positioning.promise}`,
    "",
    `**Differentiation.** ${a.positioning.differentiation}`,
    "",
  ];
  if (a.positioning.comparableTitles?.length) {
    lines.push(
      `**Comparable titles.** ${a.positioning.comparableTitles.join(", ")}`,
      ""
    );
  }
  lines.push("## Chapter Outline", "");
  a.chapters.forEach((c) => {
    lines.push(`### ${c.number}. ${c.title}`, c.summary);
    c.keyBeats?.forEach((b) => lines.push(`- ${b}`));
    lines.push("");
  });
  return lines.join("\n").trim() + "\n";
}

export function productSuiteToMarkdown(s: ProductSuite): string {
  const lines = ["# Product Suite", ""];
  s.ideas.forEach((i) => {
    lines.push(`## ${i.name}  _(${i.type})_`, "", i.description, "");
  });
  return lines.join("\n").trim() + "\n";
}

export function chapterSetToMarkdown(content: ArtifactContent): string {
  const set = toChapterSet(content);
  return (
    set.chapters
      .map((c) => c.markdown.trim())
      .join("\n\n\\newpage\n\n")
      .trim() + "\n"
  );
}

export function artifactToMarkdown(
  kind: ArtifactKind,
  content: ArtifactContent
): string {
  switch (kind) {
    case "blueprint":
      return blueprintToMarkdown(content as IPBlueprint);
    case "architecture":
      return architectureToMarkdown(content as BookArchitecture);
    case "product_suite":
      return productSuiteToMarkdown(content as ProductSuite);
    case "chapter":
      return chapterSetToMarkdown(content);
    default:
      return "";
  }
}

export const FILE_LABEL: Record<string, string> = {
  blueprint: "ip-blueprint",
  architecture: "book-architecture",
  chapter: "book-chapters",
  product_suite: "product-suite",
};
