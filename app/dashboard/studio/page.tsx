import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import StudioEngine from "@/components/StudioEngine";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAnthropicConfigured } from "@/lib/anthropic/config";
import { getSession } from "@/lib/auth";
import type { ArtifactRow } from "@/lib/anthropic/types";

export const metadata: Metadata = {
  title: "Studio Engine — Golden Shadow Publishing",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The chapter-draft stage can take 30–60s; give server actions room (Vercel Pro).
export const maxDuration = 300;

export default async function StudioPage() {
  if (!isSupabaseConfigured) {
    return (
      <>
        <Nav />
        <main>
          <PageHeader eyebrow="Studio Engine" title="Studio Engine" />
          <section className="page-section">
            <div className="empty-state">
              <h3>Not connected yet</h3>
              <p>
                The Studio Engine activates once Supabase is connected. Sign in
                and your AI publishing pipeline will live here.
              </p>
              <Link href="/" className="btn-dark">
                Back to Home
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_artifacts")
    .select("*")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });
  const artifacts = (data ?? []) as ArtifactRow[];

  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="Studio Engine"
          title={
            <>
              Turn your IP into a <em>book</em>.
            </>
          }
          subtitle="Our AI engine runs the studio pipeline on your material — blueprint, architecture, a sample chapter, and a product suite. Human-led: your editorial team makes the final call."
          breadcrumbs={[
            { href: "/", label: "Home" },
            { href: "/dashboard", label: "Dashboard" },
          ]}
        />
        <section className="page-section">
          <StudioEngine
            initialArtifacts={artifacts}
            configured={isAnthropicConfigured}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}
