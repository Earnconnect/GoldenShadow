import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import AdminNav from "@/components/AdminNav";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, isAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Orders — Golden Shadow Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Order = {
  id: string;
  created_at: string;
  tier: string | null;
  mode: string;
  amount_total: number | null;
  currency: string | null;
  customer_email: string | null;
  customer_name: string | null;
  status: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAmount(amount: number | null, currency: string | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency ?? "usd").toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

export default async function AdminOrdersPage() {
  if (!isSupabaseConfigured) {
    return (
      <>
        <Nav />
        <main>
          <PageHeader eyebrow="Studio Admin" title="Orders" />
          <section className="page-section">
            <div className="empty-state">
              <h3>Admin not connected yet</h3>
              <p>
                Add your Supabase and Stripe keys to start recording payments.
                Completed checkouts will appear here.
              </p>
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
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as Order[];

  return (
    <>
      <Nav />
      <main>
        <PageHeader eyebrow="Studio Admin" title="Orders" />
        <section className="page-section">
          <AdminNav active="orders" />

          <p className="result-count" style={{ marginTop: "28px" }}>
            {orders.length} {orders.length === 1 ? "order" : "orders"}
          </p>

          {error ? (
            <div className="empty-state">
              <h3>Couldn&apos;t load orders</h3>
              <p>{error.message}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <h3>No orders yet</h3>
              <p>
                Completed Stripe checkouts (IP Audit purchases and Platform
                subscriptions) will be recorded here automatically.
              </p>
            </div>
          ) : (
            <div className="admin-scroll">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Tier</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <div className="app-name">
                          {order.customer_name ?? "—"}
                        </div>
                        <div className="app-email">
                          {order.customer_email ?? ""}
                        </div>
                      </td>
                      <td style={{ textTransform: "capitalize" }}>
                        {order.tier ?? "—"}
                      </td>
                      <td>
                        <span className="badge-type">{order.mode}</span>
                      </td>
                      <td>{formatAmount(order.amount_total, order.currency)}</td>
                      <td>
                        <span className="status-pill status-approved">
                          {order.status ?? "paid"}
                        </span>
                      </td>
                      <td>{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
