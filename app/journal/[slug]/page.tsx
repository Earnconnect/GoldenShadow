import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getPostBySlug, getAllJournalSlugs } from "@/lib/journal-db";

export const revalidate = 60;

export function generateStaticParams() {
  return getAllJournalSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Article not found — Golden Shadow Publishing" };
  return {
    title: `${post.title} — Golden Shadow Journal`,
    description: post.excerpt,
  };
}

export default async function JournalArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <Nav />
      <main>
        <article className="article">
          <div className="breadcrumb">
            <Link href="/">Home</Link> / <Link href="/journal">Journal</Link>
          </div>
          <p className="eyebrow" style={{ margin: "28px 0 16px" }}>
            {post.tag}
          </p>
          <h1
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(30px,4.5vw,52px)",
              fontWeight: 400,
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              marginBottom: "28px",
            }}
          >
            {post.title}
          </h1>
          <div className="article-meta">
            <span>{post.date}</span>
            <span>{post.readTime}</span>
          </div>
          {post.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          <Link href="/journal" className="article-back">
            ← Back to Journal
          </Link>
        </article>
      </main>
      <Footer />
    </>
  );
}
