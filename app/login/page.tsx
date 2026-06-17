import type { Metadata } from "next";
import { Suspense } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Log In — Golden Shadow Publishing",
  description: "Log in to your Golden Shadow Publishing creator account.",
};

export default function LoginPage() {
  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="Member Access"
          title={<>Welcome back.</>}
          subtitle="Sign in to manage your creator profile, projects, and revenue."
          breadcrumbs={[{ href: "/", label: "Home" }]}
        />
        <section className="page-section">
          <Suspense>
            <LoginForm
              defaultRedirect="/dashboard"
              notConnectedTitle="Member sign-in coming soon"
              notConnectedBody="Creator dashboards activate once Supabase is connected. Want early access? Apply to join the platform."
            />
          </Suspense>
        </section>
      </main>
      <Footer />
    </>
  );
}
