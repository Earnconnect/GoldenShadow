import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import InquiryForm from "@/components/InquiryForm";
import { getCategoryBySlug } from "@/lib/data";
import { getCreatorBySlug, getAllCreatorSlugs } from "@/lib/creators-db";

// Revalidate so creator edits made in the dashboard appear publicly.
export const revalidate = 60;

export function generateStaticParams() {
  return getAllCreatorSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const creator = await getCreatorBySlug(slug);
  if (!creator) return { title: "Creator not found — Golden Shadow Publishing" };
  return {
    title: `${creator.name} — ${creator.role} · Golden Shadow Publishing`,
    description: creator.desc,
  };
}

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const creator = await getCreatorBySlug(slug);
  if (!creator) notFound();

  const category = getCategoryBySlug(creator.categorySlug);

  return (
    <>
      <Nav />
      <main>
        <div className="page-head" style={{ paddingBottom: "0", border: "none" }}>
          <div className="breadcrumb">
            <Link href="/">Home</Link> / <Link href="/creators">Creators</Link> /{" "}
            <span style={{ color: "var(--black)" }}>{creator.name}</span>
          </div>
        </div>
        <Reveal>
        <section className="page-section" style={{ paddingTop: "16px" }}>
          <div className="profile">
            <aside className="profile-aside">
              <div className="profile-avatar">
                {creator.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={creator.avatarUrl} alt={creator.name} />
                ) : (
                  creator.initial
                )}
              </div>
              <p className="creator-tag">{creator.tag}</p>
              <h1>{creator.name}</h1>
              <p className="profile-role">{creator.role}</p>
              {category && (
                <Link
                  className="profile-cat-link"
                  href={`/categories/${category.slug}`}
                >
                  View {category.name} →
                </Link>
              )}
              <p className="aside-label">Areas of Focus</p>
              <div className="tag-row">
                {creator.focus.map((f) => (
                  <span className="focus-tag" key={f}>
                    {f}
                  </span>
                ))}
              </div>
              <a
                href="#inquiry"
                className="btn-dark"
                style={{ width: "100%", textAlign: "center" }}
              >
                Work with {creator.name}
              </a>
            </aside>

            <div className="profile-main">
              <p className="profile-section-label">About</p>
              <div className="profile-bio">
                {creator.bio.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              <p className="profile-section-label">IP in Production</p>
              <ul className="proj-list">
                {creator.projects.map((proj) => (
                  <li className="proj-item" key={proj.title}>
                    <div>
                      <div className="proj-title">{proj.title}</div>
                      <div className="proj-type">{proj.type}</div>
                    </div>
                    <span className="proj-status">{proj.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
        </Reveal>
        <Reveal>
          <section
            id="inquiry"
            className="page-section"
            style={{ paddingTop: 0, maxWidth: "760px" }}
          >
            <InquiryForm creatorSlug={creator.slug} creatorName={creator.name} />
          </section>
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
