import { browseTiles } from "@/lib/data";

export default function Browse() {
  return (
    <section id="browse">
      <p className="eyebrow" style={{ marginBottom: "32px" }}>
        Browse the Platform
      </p>
      <div className="browse-grid">
        {browseTiles.map((tile) => (
          <a className="browse-tile" href={tile.href} key={tile.title}>
            <span className="bt-label">{tile.label}</span>
            <h3>{tile.title}</h3>
            <p>{tile.desc}</p>
            <span className="bt-cta">{tile.cta}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
