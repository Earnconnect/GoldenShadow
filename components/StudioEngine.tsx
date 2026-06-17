"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  saveSourceMaterial,
  runBlueprint,
  runArchitecture,
  runProductSuite,
  type StudioState,
} from "@/app/dashboard/studio/actions";
import {
  toChapterSet,
  type ArtifactRow,
  type ArtifactKind,
  type IPBlueprint,
  type BookArchitecture,
  type ProductSuite,
  type ChapterDraft,
  type ReviewStatus,
} from "@/lib/anthropic/types";
import { artifactToMarkdown, FILE_LABEL } from "@/lib/export";
import Disclaimer from "@/components/studio/Disclaimer";
import ArtifactBlueprint from "@/components/studio/ArtifactBlueprint";
import ArtifactArchitecture from "@/components/studio/ArtifactArchitecture";
import ArtifactProductSuite from "@/components/studio/ArtifactProductSuite";
import ChapterSet from "@/components/studio/ChapterSet";

type StageKey = "blueprint" | "architecture" | "chapter" | "product_suite";
type StructuredKey = "blueprint" | "architecture" | "product_suite";

const STAGES: { key: StageKey; num: string; title: string; desc: string }[] = [
  {
    key: "blueprint",
    num: "1",
    title: "IP Blueprint",
    desc: "Book concept, three product paths, and a 12-month launch roadmap.",
  },
  {
    key: "architecture",
    num: "2",
    title: "Book Architecture",
    desc: "Positioning plus a chapter-by-chapter outline.",
  },
  {
    key: "chapter",
    num: "3",
    title: "Chapters",
    desc: "Draft any chapter from your outline — live, word by word.",
  },
  {
    key: "product_suite",
    num: "4",
    title: "Product Suite",
    desc: "Playbooks, workbooks, merch, and course ideas that extend your IP.",
  },
];

const RUNNERS: Record<StructuredKey, (g?: string) => Promise<StudioState>> = {
  blueprint: runBlueprint,
  architecture: runArchitecture,
  product_suite: runProductSuite,
};

const REVIEW_LABEL: Record<ReviewStatus, string> = {
  pending: "Pending review",
  approved: "Approved by studio",
  needs_work: "Needs work",
};

function renderArtifact(kind: ArtifactKind, content: ArtifactRow["content"]) {
  switch (kind) {
    case "blueprint":
      return <ArtifactBlueprint data={content as IPBlueprint} />;
    case "architecture":
      return <ArtifactArchitecture data={content as BookArchitecture} />;
    case "chapter":
      return <ChapterSet content={content} />;
    case "product_suite":
      return <ArtifactProductSuite data={content as ProductSuite} />;
    default:
      return null;
  }
}

function downloadMarkdown(kind: ArtifactKind, content: ArtifactRow["content"]) {
  const md = artifactToMarkdown(kind, content);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `golden-shadow-${FILE_LABEL[kind] ?? kind}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function StudioEngine({
  initialArtifacts,
  configured,
}: {
  initialArtifacts: ArtifactRow[];
  configured: boolean;
}) {
  const byKind = (k: ArtifactKind) =>
    initialArtifacts.find((a) => a.kind === k);

  const initialSource =
    (byKind("source")?.content as { text?: string } | undefined)?.text ?? "";

  const [source, setSource] = useState(initialSource);
  const [sourceSaved, setSourceSaved] = useState(initialSource.length > 0);
  const [savingSource, setSavingSource] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [artifacts, setArtifacts] = useState<Record<string, ArtifactRow>>(
    () => {
      const map: Record<string, ArtifactRow> = {};
      for (const a of initialArtifacts) map[a.kind] = a;
      return map;
    }
  );
  const [pending, setPending] = useState<StageKey | null>(null);
  const [notice, setNotice] = useState<StudioState | null>(null);
  const [streamingChapter, setStreamingChapter] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<Record<string, string>>({});
  const [selectedChapter, setSelectedChapter] = useState(1);

  const outline =
    (artifacts.architecture?.content as BookArchitecture | undefined)
      ?.chapters ?? [];
  const draftedNumbers = new Set(
    toChapterSet(artifacts.chapter?.content).chapters.map((c) => c.number)
  );

  async function onSaveSource() {
    setSavingSource(true);
    setNotice(null);
    const fd = new FormData();
    fd.set("source", source);
    const res = await saveSourceMaterial({ status: "idle", message: "" }, fd);
    setNotice(res);
    if (res.status === "success") setSourceSaved(true);
    setSavingSource(false);
  }

  async function onUpload(file: File) {
    setUploading(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.set("file", file);
      const resp = await fetch("/api/studio/upload", { method: "POST", body: fd });
      const json = await resp.json();
      if (!resp.ok) setUploadError(json.error ?? "Upload failed.");
      else {
        setSource((prev) =>
          prev.trim()
            ? `${prev}\n\n--- ${json.filename} ---\n${json.text}`
            : json.text
        );
        setSourceSaved(false);
      }
    } catch {
      setUploadError("Upload failed. Please try again.");
    }
    setUploading(false);
  }

  async function onRunStructured(key: StructuredKey) {
    setPending(key);
    setNotice(null);
    const res = await RUNNERS[key](guidance[key]?.trim() || undefined);
    if (res.artifact) {
      setArtifacts((prev) => ({ ...prev, [res.artifact!.kind]: res.artifact! }));
    }
    setNotice(res);
    setPending(null);
  }

  async function onStreamChapter() {
    setPending("chapter");
    setNotice(null);
    setStreamingChapter("");
    try {
      const resp = await fetch("/api/studio/chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterNumber: selectedChapter,
          guidance: guidance.chapter?.trim() || undefined,
        }),
      });
      if (!resp.ok || !resp.body) {
        const j = await resp.json().catch(() => ({}));
        setNotice({
          status: "error",
          message: j.error ?? "Couldn't generate the chapter.",
        });
        setStreamingChapter(null);
        setPending(null);
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreamingChapter(acc);
      }
      acc += decoder.decode();
      const md = acc.trim();
      const titleMatch = md.match(/^#\s+(.+)$/m);
      const outlineTitle = outline.find(
        (c) => c.number === selectedChapter
      )?.title;
      const draft: ChapterDraft = {
        number: selectedChapter,
        chapterTitle:
          outlineTitle ?? titleMatch?.[1] ?? `Chapter ${selectedChapter}`,
        markdown: md,
        wordCountEstimate: md.split(/\s+/).filter(Boolean).length,
      };
      // Merge into the local chapter set (preserve review fields/id).
      const prevChapter = artifacts.chapter;
      const set = toChapterSet(prevChapter?.content);
      const idx = set.chapters.findIndex((c) => c.number === draft.number);
      if (idx >= 0) set.chapters[idx] = draft;
      else set.chapters.push(draft);
      set.chapters.sort((a, b) => a.number - b.number);
      const merged: ArtifactRow = {
        id: prevChapter?.id ?? "chapter-local",
        created_at: prevChapter?.created_at ?? "",
        updated_at: "",
        user_id: prevChapter?.user_id ?? "",
        creator_slug: prevChapter?.creator_slug ?? null,
        kind: "chapter",
        title: "Book Chapters",
        content: set,
        model: null,
        review_status: prevChapter?.review_status ?? null,
        review_note: prevChapter?.review_note ?? null,
      };
      setArtifacts((prev) => ({ ...prev, chapter: merged }));
      setStreamingChapter(null);
      setNotice({
        status: configured ? "success" : "preview",
        message: configured
          ? "Chapter drafted."
          : "Preview sample generated (connect the AI engine for real output).",
      });
    } catch {
      setNotice({ status: "error", message: "Couldn't generate the chapter." });
      setStreamingChapter(null);
    }
    setPending(null);
  }

  function guidanceField(key: StageKey) {
    return (
      <input
        type="text"
        className="studio-guidance"
        placeholder="Optional guidance — e.g. punchier, ~1,500 words, focus on the framework"
        value={guidance[key] ?? ""}
        onChange={(e) =>
          setGuidance((g) => ({ ...g, [key]: e.target.value }))
        }
        disabled={pending === key}
      />
    );
  }

  function reviewBanner(a: ArtifactRow | undefined) {
    if (!a?.review_status) return null;
    return (
      <div className={`review-banner review-${a.review_status}`}>
        <strong>{REVIEW_LABEL[a.review_status]}</strong>
        {a.review_note ? ` — ${a.review_note}` : ""}
      </div>
    );
  }

  return (
    <>
      {!configured && (
        <div className="studio-banner">
          Preview mode — the AI engine isn&apos;t connected, so stages return
          realistic sample output. Add an <code>ANTHROPIC_API_KEY</code> to
          generate from your own material.
        </div>
      )}

      {/* Source material */}
      <div className="studio-source">
        <p className="profile-section-label">Source Material</p>
        <p className="form-fineprint" style={{ marginTop: "-8px" }}>
          Paste talks, transcripts, notes, or your bio — or upload a file
          (.txt, .md, .docx, .pdf). The more you give it, the better the output.
        </p>
        <textarea
          className="studio-textarea"
          rows={10}
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            setSourceSaved(false);
          }}
          placeholder="Paste your raw material here…"
        />
        <div className="studio-source-actions">
          <label className="btn-outline studio-upload">
            {uploading ? "Reading…" : "Upload a file"}
            <input
              type="file"
              accept=".txt,.md,.markdown,.docx,.pdf"
              hidden
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
          </label>
          <button
            className="btn-dark"
            onClick={onSaveSource}
            disabled={savingSource || source.trim().length < 40}
          >
            {savingSource ? "Saving…" : "Save source material"}
          </button>
          {sourceSaved && <span className="studio-saved">✓ Saved</span>}
        </div>
        {uploadError && <p className="form-error">{uploadError}</p>}
      </div>

      {notice && notice.status !== "idle" && (
        <p
          className={notice.status === "error" ? "form-error" : "form-success"}
          style={{ marginTop: "20px" }}
        >
          {notice.message}
        </p>
      )}

      {/* Stages */}
      <div className="studio-stages">
        {STAGES.map((stage) => {
          const artifact = artifacts[stage.key];
          const isPending = pending === stage.key;
          const isChapter = stage.key === "chapter";
          const isStreaming =
            isChapter && isPending && streamingChapter !== null;
          return (
            <div className="studio-stage" key={stage.key}>
              <div className="studio-stage-head">
                <div className="studio-stage-num">{stage.num}</div>
                <div className="studio-stage-meta">
                  <h3>{stage.title}</h3>
                  <p>{stage.desc}</p>
                </div>
                {!isChapter && (
                  <button
                    className="btn-outline"
                    onClick={() => onRunStructured(stage.key as StructuredKey)}
                    disabled={isPending || !sourceSaved}
                  >
                    {isPending ? "Generating…" : artifact ? "Regenerate" : "Generate"}
                  </button>
                )}
              </div>

              {guidanceField(stage.key)}

              {/* Chapter selector + draft control */}
              {isChapter && (
                <div className="chapter-controls">
                  <select
                    className="studio-select"
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(Number(e.target.value))}
                    disabled={isPending}
                  >
                    {outline.length > 0 ? (
                      outline.map((c) => (
                        <option key={c.number} value={c.number}>
                          Ch. {c.number}: {c.title}
                          {draftedNumbers.has(c.number) ? "  ✓" : ""}
                        </option>
                      ))
                    ) : (
                      <option value={1}>Opening chapter</option>
                    )}
                  </select>
                  <button
                    className="btn-outline"
                    onClick={onStreamChapter}
                    disabled={isPending || !sourceSaved}
                  >
                    {isPending
                      ? "Writing…"
                      : draftedNumbers.has(selectedChapter)
                        ? "Redraft this chapter"
                        : "Draft this chapter"}
                  </button>
                </div>
              )}

              {reviewBanner(artifact)}

              {isStreaming ? (
                <div className="studio-artifact">
                  <div className="artifact-body">
                    <span className="artifact-label studio-streaming">
                      Writing live…
                    </span>
                    <div className="chapter-prose">
                      {streamingChapter ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {streamingChapter}
                        </ReactMarkdown>
                      ) : (
                        <p className="form-fineprint">Thinking…</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                artifact && (
                  <div className="studio-artifact">
                    {renderArtifact(stage.key, artifact.content)}
                    <div className="artifact-actions">
                      <button
                        className="artifact-dl"
                        onClick={() =>
                          downloadMarkdown(stage.key, artifact.content)
                        }
                      >
                        ↓ Download .md
                      </button>
                      {isChapter && (
                        <a
                          className="artifact-dl"
                          href="/dashboard/studio/print"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          ⎙ Print / Save as PDF
                        </a>
                      )}
                    </div>
                    <Disclaimer />
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
