import Link from "next/link";
import { categories } from "@/lib/data";

export default function Categories() {
  return (
    <section id="categories">
      <div className="cat-header">
        <div>
          <p className="eyebrow">Creator Categories</p>
          <h2>Every kind of IP, one platform</h2>
        </div>
        <Link href="/categories">See all categories →</Link>
      </div>
      <div className="cat-scroll">
        {categories.map((cat) => (
          <Link
            className="cat-chip"
            href={`/categories/${cat.slug}`}
            key={cat.slug}
          >
            <div className="cat-icon">{cat.icon}</div>
            <span>{cat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
