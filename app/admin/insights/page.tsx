import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import AdminNav from "@/components/AdminNav";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, isAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Insights — Golden Shadow Admin",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderRow = {
  amount_total: number | null;
  currency: string | null;
  mode: string | null;
  created_at: string;
};
type AppRow = { status: string | null; created_at: string };

function money(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

// Minimal inline-SVG bar chart (no charting dependency).
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = 100 / data.length;
  return (
    <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="chart-svg">
      {data.map((d, i) => {
        const h = (d.value / max) * 46;
        return (
          <rect
            key={i}
            x={i * bw + bw * 0.2}
            y={50 - h}
            width={bw * 0.6}
            height={h}
            className="chart-bar"
          />
        );
      })}
    </svg>
  );
}

function ChartLegend({ data, format }: { data: { label: string; value: number }[]; format: (n: number) => string }) {
  return (
    <div className="chart-legend">
      {data.map((d, i) => (
        <div key={i}>
          <span className="cl-v">{format(d.value)}</span>
          <span className="cl-l">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default async function AdminInsightsPage() {
  if (!isSupabaseConfigured) {
    return (
      <>
        <Nav />
        <main>
          <PageHeader eyebrow="Studio Admin" title="Insights" />
          <section className="page-section">
            <div className="empty-state">
              <h3>Admin not connected yet</h3>
              <p>Connect Supabase &amp; Stripe to see revenue and funnel analytics.</p>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isAdmin(session)) redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: orderData }, { data: appData }] = await Promise.all([
    supabase.from("orders").select("amount_total, currency, mode, created_at"),
    supabase.from("applications").select("status, created_at"),
  ]);
  const orders = (orderData ?? []) as OrderRow[];
  const applications = (appData ?? []) as AppRow[];

  const currency = orders[0]?.currency ?? "usd";
  const totalRevenue = orders.reduce((s, o) => s + (o.amount_total ?? 0), 0);
  const mrr = orders
    .filter((o) => o.mode === "subscription")
    .reduce((s, o) => s + (o.amount_total ?? 0), 0);
  const approved = applications.filter((a) => a.status === "approved").length;
  const approvalRate = applications.length
    ? Math.round((approved / applications.length) * 100)
    : 0;
  const conversion = applications.length
    ? Math.round((orders.length / applications.length) * 100)
    : 0;

  // Applications by status
  const statuses = ["pending", "approved", "declined"];
  const byStatus = statuses.map((s) => ({
    label: s,
    value: applications.filter((a) => (a.status ?? "pending") === s).length,
  }));

  // Revenue over the last 6 months
  const now = new Date();
  const months: { label: string; key: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleDateString("en-US", { month: "short" }),
      key: `${d.getFullYear()}-${d.getMonth()}`,
      value: 0,
    });
  }
  for (const o of orders) {
    const d = new Date(o.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = months.find((m) => m.key === key);
    if (bucket) bucket.value += o.amount_total ?? 0;
  }

  const cards = [
    { v: money(totalRevenue, currency), l: "Total revenue" },
    { v: money(mrr, currency) + "/mo", l: "Recurring (MRR)" },
    { v: String(orders.length), l: "Orders" },
    { v: String(applications.length), l: "Applications" },
    { v: approvalRate + "%", l: "Approval rate" },
    { v: conversion + "%", l: "App → order" },
  ];

  return (
    <>
      <Nav />
      <main>
        <PageHeader eyebrow="Studio Admin" title="Insights" />
        <section className="page-section">
          <AdminNav active="insights" />

          <div className="insight-cards" style={{ marginTop: "32px" }}>
            {cards.map((c) => (
              <div className="insight-card" key={c.l}>
                <span className="ic-v">{c.v}</span>
                <small>{c.l}</small>
              </div>
            ))}
          </div>

          <div className="chart-grid">
            <div className="chart-card">
              <p className="profile-section-label">Revenue · last 6 months</p>
              <BarChart data={months} />
              <ChartLegend
                data={months}
                format={(n) => money(n, currency)}
              />
            </div>
            <div className="chart-card">
              <p className="profile-section-label">Applications by status</p>
              <BarChart data={byStatus} />
              <ChartLegend data={byStatus} format={(n) => String(n)} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
