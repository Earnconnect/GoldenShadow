"use client";

import { useState } from "react";
import { categories, type Creator } from "@/lib/data";
import CreatorCard from "@/components/CreatorCard";

export default function CreatorDirectory({
  creators,
}: {
  creators: Creator[];
}) {
  const [active, setActive] = useState<string>("all");

  // Only show filter chips for categories that actually have creators.
  const usedCategories = categories.filter((cat) =>
    creators.some((c) => c.categorySlug === cat.slug)
  );

  const filtered =
    active === "all"
      ? creators
      : creators.filter((c) => c.categorySlug === active);

  return (
    <>
      <div className="filter-bar">
        <button
          className={`filter-chip${active === "all" ? " active" : ""}`}
          onClick={() => setActive("all")}
        >
          All Creators
        </button>
        {usedCategories.map((cat) => (
          <button
            key={cat.slug}
            className={`filter-chip${active === cat.slug ? " active" : ""}`}
            onClick={() => setActive(cat.slug)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <p className="result-count">
        Showing {filtered.length}{" "}
        {filtered.length === 1 ? "creator" : "creators"}
      </p>

      <div className="creators-grid">
        {filtered.map((creator) => (
          <CreatorCard key={creator.slug} creator={creator} />
        ))}
      </div>
    </>
  );
}
