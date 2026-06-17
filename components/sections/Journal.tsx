import Link from "next/link";
import { journalPosts } from "@/lib/data";

export default function Journal() {
  return (
    <section id="journal">
      <div className="j-header">
        <div>
          <p className="eyebrow">From the Golden Shadow Journal</p>
          <h2>How we think about IP &amp; influence</h2>
        </div>
        <Link href="/journal">Read all articles →</Link>
      </div>
      <div className="j-grid">
        {journalPosts.map((post) => (
          <div className="j-card" key={post.slug}>
            <p className="j-tag">{post.tag}</p>
            <h3>{post.title}</h3>
            <p>{post.excerpt}</p>
            <Link href={`/journal/${post.slug}`} className="jlink">
              Read article →
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
