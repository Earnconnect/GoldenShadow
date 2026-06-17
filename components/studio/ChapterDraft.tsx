import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChapterDraft as ChapterDraftType } from "@/lib/anthropic/types";

export default function ChapterDraft({ data }: { data: ChapterDraftType }) {
  return (
    <div className="artifact-body">
      <span className="artifact-label">
        ~{data.wordCountEstimate.toLocaleString()} words
      </span>
      <div className="chapter-prose">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {data.markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
