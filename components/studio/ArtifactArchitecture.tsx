import type { BookArchitecture } from "@/lib/anthropic/types";

export default function ArtifactArchitecture({
  data,
}: {
  data: BookArchitecture;
}) {
  return (
    <div className="artifact-body">
      <p className="artifact-sub">Positioning</p>
      <p className="artifact-text">
        <strong>Hook.</strong> {data.positioning.hook}
      </p>
      <p className="artifact-text">
        <strong>Promise.</strong> {data.positioning.promise}
      </p>
      <p className="artifact-text">
        <strong>Differentiation.</strong> {data.positioning.differentiation}
      </p>
      {data.positioning.comparableTitles?.length > 0 && (
        <p className="artifact-text">
          <strong>Comparable titles.</strong>{" "}
          {data.positioning.comparableTitles.join(", ")}
        </p>
      )}

      <p className="artifact-sub" style={{ marginTop: "28px" }}>
        Chapter Outline
      </p>
      <ol className="chapter-outline">
        {data.chapters.map((c) => (
          <li key={c.number}>
            <span className="ch-num">{String(c.number).padStart(2, "0")}</span>
            <div>
              <strong>{c.title}</strong>
              <p>{c.summary}</p>
              {c.keyBeats?.length > 0 && (
                <ul className="ch-beats">
                  {c.keyBeats.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
