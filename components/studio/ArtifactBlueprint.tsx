import type { IPBlueprint } from "@/lib/anthropic/types";

export default function ArtifactBlueprint({ data }: { data: IPBlueprint }) {
  return (
    <div className="artifact-body">
      <p className="artifact-sub">Book Concept</p>
      <h4 className="artifact-title">{data.bookConcept.workingTitle}</h4>
      <p className="artifact-text">{data.bookConcept.premise}</p>
      <div className="artifact-meta-grid">
        <div>
          <span className="artifact-label">Target reader</span>
          <p>{data.bookConcept.targetReader}</p>
        </div>
        <div>
          <span className="artifact-label">Positioning</span>
          <p>{data.bookConcept.positioning}</p>
        </div>
      </div>

      <p className="artifact-sub" style={{ marginTop: "28px" }}>
        Three Product Paths
      </p>
      <div className="path-grid">
        {data.productPaths.map((p, i) => (
          <div className="path-card" key={i}>
            <span className="artifact-label">{p.format}</span>
            <strong>{p.name}</strong>
            <p>{p.description}</p>
          </div>
        ))}
      </div>

      <p className="artifact-sub" style={{ marginTop: "28px" }}>
        12-Month Launch Roadmap
      </p>
      <ul className="roadmap">
        {data.launchRoadmap.map((phase, i) => (
          <li key={i}>
            <span className="roadmap-when">{phase.months}</span>
            <div>
              <strong>{phase.milestone}</strong>
              <p>{phase.activities.join(" · ")}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
