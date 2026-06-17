import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import CreatorAdminForm from "@/components/CreatorAdminForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, isAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "New Creator — Golden Shadow Admin",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NewCreatorPage() {
  if (!isSupabaseConfigured) redirect("/admin/creators");
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isAdmin(session)) redirect("/dashboard");

  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="Studio Admin"
          title="New Creator"
          breadcrumbs={[{ href: "/admin/creators", label: "Creators" }]}
        />
        <section className="page-section">
          <CreatorAdminForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
