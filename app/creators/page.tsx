import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import CreatorDirectory from "@/components/CreatorDirectory";
import Reveal from "@/components/Reveal";
import { getAllCreators } from "@/lib/creators-db";

export const metadata: Metadata = {
  title: "Creators & Executives — Golden Shadow Publishing",
  description:
    "Browse the curated roster of creators and executives turning their IP into books, products, and enduring revenue with Golden Shadow Publishing.",
};

export const revalidate = 60;

export default async function CreatorsPage() {
  const creators = await getAllCreators();
  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="The Roster"
          title={
            <>
              Creators &amp; executives,
              <br />
              <em>curated</em> for legacy.
            </>
          }
          subtitle="A curated roster of leaders turning a lifetime of expertise into books, playbooks, and products they fully own."
          breadcrumbs={[{ href: "/", label: "Home" }]}
        />
        <Reveal>
          <section className="page-section">
            <CreatorDirectory creators={creators} />
          </section>
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
