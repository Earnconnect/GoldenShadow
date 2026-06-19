import { postInquiryMessage } from "@/app/dashboard/actions";

export type ThreadEntry = {
  role: "creator" | "member";
  body: string;
  at: string;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// A single conversation thread + reply box. `currentRole` decides which side
// each bubble sits on ("me" vs "them").
export default function ConversationThread({
  inquiryId,
  currentRole,
  title,
  subtitle,
  entries,
}: {
  inquiryId: string;
  currentRole: "creator" | "member";
  title: string;
  subtitle?: string;
  entries: ThreadEntry[];
}) {
  return (
    <div className="thread-card">
      <div className="thread-head">
        <div>
          <div className="app-name">{title}</div>
          {subtitle && <div className="app-email">{subtitle}</div>}
        </div>
      </div>

      <div className="thread-log">
        {entries.map((e, i) => (
          <div
            key={i}
            className={`bubble ${e.role === currentRole ? "bubble-me" : "bubble-them"}`}
          >
            <p>{e.body}</p>
            <span className="bubble-at">{fmt(e.at)}</span>
          </div>
        ))}
      </div>

      <form action={postInquiryMessage} className="thread-reply">
        <input type="hidden" name="inquiry_id" value={inquiryId} />
        <textarea
          name="body"
          rows={2}
          placeholder="Write a reply…"
          required
          maxLength={2000}
        />
        <button type="submit" className="btn-dark">
          Send
        </button>
      </form>
    </div>
  );
}
