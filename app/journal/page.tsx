import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import { getPublishedPosts } from "@/lib/journal-db";

export const metadata: Metadata = {
  title: "Journal — Golden Shadow Publishing",
  description:
    "How we think about IP, publishing, and influence. Essays from the Golden Shadow studio.",
};

export const revalidate = 60;

export default async function JournalPage() {
  const journalPosts = await getPublishedPosts();
  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="From the Golden Shadow Journal"
          title={
            <>
              How we think about
              <br />
              IP &amp; <em>influence.</em>
            </>
          }
          subtitle="Essays on turning expertise into books, products, and lasting assets."
          breadcrumbs={[{ href: "/", label: "Home" }]}
        />
        <Reveal>
          <section className="page-section">
            <div className="j-grid">
              {journalPosts.map((post) => (
                <div className="j-card" key={post.slug}>
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
          </section>
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
