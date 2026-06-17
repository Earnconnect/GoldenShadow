import Link from "next/link";
import { getAllCreators } from "@/lib/creators-db";
import CreatorCard from "@/components/CreatorCard";

export default async function Creators() {
  const creators = (await getAllCreators()).slice(0, 4);

  return (
    <section id="creators">
      <div className="creators-header">
        <div>
          <p className="eyebrow">Featured Creators &amp; Executives</p>
          <h2>Trusted by leaders who move culture</h2>
        </div>
        <Link href="/creators">See all creators →</Link>
      </div>
      <div className="creators-grid">
        {creators.map((creator) => (
          <CreatorCard key={creator.slug} creator={creator} />
        ))}
      </div>
    </section>
  );
}
