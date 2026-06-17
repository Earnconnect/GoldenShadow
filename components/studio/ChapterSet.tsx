import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toChapterSet, type ArtifactContent } from "@/lib/anthropic/types";

// Renders a chapter artifact (one or many drafted chapters), tolerant of the
// legacy single-chapter shape via toChapterSet().
export default function ChapterSet({
  content,
  open = false,
}: {
  content: ArtifactContent;
  open?: boolean;
}) {
  const set = toChapterSet(content);
  if (set.chapters.length === 0) {
    return <p className="form-fineprint">No chapters drafted yet.</p>;
  }
  return (
    <div className="artifact-body">
      {set.chapters.map((c) => (
        <details className="chapter-item" key={c.number} open={open}>
          <summary>
            <span className="chapter-item-num">
              Ch. {c.number}
            </span>
            {c.chapterTitle}
            <span className="chapter-item-words">
              ~{c.wordCountEstimate.toLocaleString()} words
            </span>
          </summary>
          <div className="chapter-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {c.markdown}
            </ReactMarkdown>
          </div>
        </details>
      ))}
    </div>
  );
}
