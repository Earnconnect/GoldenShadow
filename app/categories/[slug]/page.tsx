import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import CreatorCard from "@/components/CreatorCard";
import Reveal from "@/components/Reveal";
import { categories, getCategoryBySlug } from "@/lib/data";
import { getCreatorsByCategory } from "@/lib/creators-db";

export const revalidate = 60;

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category)
    return { title: "Category not found — Golden Shadow Publishing" };
  return {
    title: `${category.name} — Golden Shadow Publishing`,
    description: `Creators and executives in ${category.name} turning their IP into books and products with Golden Shadow.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const categoryCreators = await getCreatorsByCategory(category.slug);

  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="Category"
          title={
            <>
              {category.icon} {category.name}
            </>
          }
          subtitle={`Creators and executives building enduring IP in ${category.name}.`}
          breadcrumbs={[
            { href: "/", label: "Home" },
            { href: "/categories", label: "Categories" },
          ]}
        />
        <Reveal>
        <section className="page-section">
          {categoryCreators.length > 0 ? (
            <>
              <p className="result-count">
                {categoryCreators.length}{" "}
                {categoryCreators.length === 1 ? "creator" : "creators"} in this
                category
              </p>
              <div className="creators-grid">
                {categoryCreators.map((creator) => (
                  <CreatorCard key={creator.slug} creator={creator} />
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h3>No creators here yet</h3>
              <p>
                We&apos;re onboarding leaders in {category.name} now. Apply to be
                among the first featured in this category.
              </p>
              <Link href="/apply" className="btn-dark">
                Apply to Join
              </Link>
            </div>
          )}
        </section>
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
