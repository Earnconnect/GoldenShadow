import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import { categories } from "@/lib/data";
import { getCategoryCounts } from "@/lib/creators-db";

export const metadata: Metadata = {
  title: "Categories — Golden Shadow Publishing",
  description:
    "Explore IP and books across business, finance, culture, wellness, media, and more on the Golden Shadow marketplace.",
};

export const revalidate = 60;

export default async function CategoriesPage() {
  const counts = await getCategoryCounts();
  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="Creator Categories"
          title={
            <>
              Every kind of IP,
              <br />
              <em>one</em> platform.
            </>
          }
          subtitle="Browse the marketplace by the fields our creators and executives know best."
          breadcrumbs={[{ href: "/", label: "Home" }]}
        />
        <Reveal>
          <section className="page-section">
            <div className="browse-grid">
            {categories.map((cat) => {
              const count = counts[cat.slug] ?? 0;
              return (
                <Link
                  className="browse-tile"
                  href={`/categories/${cat.slug}`}
                  key={cat.slug}
                >
                  <span className="cat-icon" style={{ fontSize: "28px" }}>
                    {cat.icon}
                  </span>
                  <h3>{cat.name}</h3>
                  <p>
                    {count > 0
                      ? `${count} ${count === 1 ? "creator" : "creators"}`
                      : "Be the first to join"}
                  </p>
                  <span className="bt-cta">View Category →</span>
                </Link>
              );
            })}
            </div>
          </section>
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
