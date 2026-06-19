"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { JournalPost } from "@/lib/data";

export default function JournalBrowser({ posts }: { posts: JournalPost[] }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const tags = useMemo(
    () =>
      Array.from(new Set(posts.map((p) => p.tag).filter(Boolean))).sort(),
    [posts]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return posts.filter((p) => {
      if (tag && p.tag !== tag) return false;
      if (!needle) return true;
      return (
        p.title.toLowerCase().includes(needle) ||
        p.excerpt.toLowerCase().includes(needle) ||
        p.tag.toLowerCase().includes(needle)
      );
    });
  }, [posts, q, tag]);

  return (
    <>
      <div className="journal-controls">
        <input
          type="search"
          className="journal-search"
          placeholder="Search articles…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search the journal"
        />
        <div className="filter-bar">
          <button
            type="button"
            className={`filter-chip${tag === null ? " active" : ""}`}
            onClick={() => setTag(null)}
          >
            All
          </button>
          {tags.map((t) => (
            <button
              type="button"
              key={t}
              className={`filter-chip${tag === t ? " active" : ""}`}
              onClick={() => setTag(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No articles found</h3>
          <p>Try a different search or clear the filter.</p>
        </div>
      ) : (
        <div className="j-grid">
          {filtered.map((post) => (
            <div className="j-card" key={post.slug}>
              {post.coverUrl && (
                <Link href={`/journal/${post.slug}`} className="j-cover">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.coverUrl} alt="" loading="lazy" />
                </Link>
              )}
              <p className="j-tag">
                {post.tag} · {post.readTime}
              </p>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <Link href={`/journal/${post.slug}`} className="jlink">
                Read article →
              </Link>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
