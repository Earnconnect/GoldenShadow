import type { Metadata } from "next";
import { Suspense } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Admin Sign In — Golden Shadow Publishing",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="Studio Admin"
          title="Sign in"
          subtitle="Review and manage creator & executive applications."
        />
        <section className="page-section">
          <Suspense>
            <LoginForm
              defaultRedirect="/admin"
              notConnectedTitle="Admin not connected yet"
              notConnectedBody="Add your Supabase keys to .env.local and create an admin user in the Supabase dashboard to enable sign-in."
            />
          </Suspense>
        </section>
      </main>
      <Footer />
    </>
  );
}
