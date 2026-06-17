import Link from "next/link";
import type { Creator } from "@/lib/data";

export default function CreatorCard({ creator }: { creator: Creator }) {
  return (
    <Link className="creator-card" href={`/creators/${creator.slug}`}>
      <div className="creator-avatar">{creator.initial}</div>
      <div className="creator-info">
        <p className="creator-tag">{creator.tag}</p>
        <h3 className="creator-name">{creator.name}</h3>
        <p className="creator-desc">{creator.desc}</p>
        <span className="creator-badge">{creator.badge}</span>
      </div>
    </Link>
  );
}
