import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import JournalBrowser from "@/components/JournalBrowser";
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
            <JournalBrowser posts={journalPosts} />
          </section>
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
