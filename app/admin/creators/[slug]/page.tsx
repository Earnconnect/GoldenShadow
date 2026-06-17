import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import CreatorAdminForm from "@/components/CreatorAdminForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, isAdmin } from "@/lib/auth";
import { getCreatorBySlug } from "@/lib/creators-db";

export const metadata: Metadata = {
  title: "Edit Creator — Golden Shadow Admin",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditCreatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSupabaseConfigured) redirect("/admin/creators");

  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isAdmin(session)) redirect("/dashboard");

  const creator = await getCreatorBySlug(slug);
  if (!creator) notFound();

  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="Studio Admin"
          title={`Edit · ${creator.name}`}
          breadcrumbs={[{ href: "/admin/creators", label: "Creators" }]}
        />
        <section className="page-section">
          <CreatorAdminForm creator={creator} />
        </section>
      </main>
      <Footer />
    </>
  );
}
