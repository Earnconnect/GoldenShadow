import type { ProductSuite } from "@/lib/anthropic/types";

export default function ArtifactProductSuite({
  data,
}: {
  data: ProductSuite;
}) {
  return (
    <div className="artifact-body">
      <div className="path-grid">
        {data.ideas.map((idea, i) => (
          <div className="path-card" key={i}>
            <span className="artifact-label">{idea.type}</span>
            <strong>{idea.name}</strong>
            <p>{idea.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
