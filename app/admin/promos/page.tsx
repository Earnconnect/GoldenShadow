import type { Metadata } from "next";
import type Stripe from "stripe";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import AdminNav from "@/components/AdminNav";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, isAdmin } from "@/lib/auth";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { createPromo, togglePromo } from "./actions";

export const metadata: Metadata = {
  title: "Promo Codes — Golden Shadow Admin",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function discountLabel(coupon: Stripe.Coupon | null): string {
  if (!coupon) return "—";
  const base =
    coupon.percent_off != null
      ? `${coupon.percent_off}% off`
      : coupon.amount_off != null
        ? `$${(coupon.amount_off / 100).toFixed(2)} off`
        : "—";
  return coupon.duration === "forever" ? `${base} (recurring)` : base;
}

export default async function AdminPromosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const { ok, err } = await searchParams;

  if (!isSupabaseConfigured) {
    return (
      <>
        <Nav />
        <main>
          <PageHeader eyebrow="Studio Admin" title="Promo Codes" />
          <section className="page-section">
            <div className="empty-state">
              <h3>Admin not connected yet</h3>
              <p>Connect Supabase and Stripe to manage promo codes.</p>
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

  const stripe = getStripe();
  const stripeReady = isStripeConfigured && !!stripe;

  let promos: Stripe.PromotionCode[] = [];
  if (stripeReady) {
    try {
      const res = await stripe!.promotionCodes.list({
        limit: 100,
        expand: ["data.promotion.coupon"],
      });
      promos = res.data;
    } catch {
      promos = [];
    }
  }

  return (
    <>
      <Nav />
      <main>
        <PageHeader eyebrow="Studio Admin" title="Promo Codes" />
        <section className="page-section">
          <AdminNav active="promos" />

          {ok && (
            <p className="form-success" style={{ marginTop: "28px" }}>
              Promo code created.
            </p>
          )}
          {err && (
            <p className="form-error" style={{ marginTop: "28px" }}>
              {err}
            </p>
          )}

          {!stripeReady ? (
            <div className="empty-state" style={{ marginTop: "28px" }}>
              <h3>Stripe not connected</h3>
              <p>Add your Stripe keys to create and manage promo codes.</p>
            </div>
          ) : (
            <>
              <p className="profile-section-label" style={{ marginTop: "32px" }}>
                New promo code
              </p>
              <form
                action={createPromo}
                className="apply-form"
                style={{ maxWidth: "720px" }}
              >
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label" htmlFor="code">
                      Code <span className="label-hint">(uppercase, no spaces)</span>
                    </label>
                    <input
                      id="code"
                      name="code"
                      type="text"
                      placeholder="LAUNCH20"
                      maxLength={40}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="kind">
                      Discount type
                    </label>
                    <select id="kind" name="kind" className="studio-select">
                      <option value="percent">Percent (%)</option>
                      <option value="amount">Fixed amount ($)</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label" htmlFor="value">
                      Value *
                    </label>
                    <input
                      id="value"
                      name="value"
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="20"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="duration">
                      Applies
                    </label>
                    <select id="duration" name="duration" className="studio-select">
                      <option value="once">Once (first payment)</option>
                      <option value="forever">Every payment (subscriptions)</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label" htmlFor="max_redemptions">
                      Max uses <span className="label-hint">(optional)</span>
                    </label>
                    <input
                      id="max_redemptions"
                      name="max_redemptions"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="unlimited"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="expires">
                      Expires <span className="label-hint">(optional)</span>
                    </label>
                    <input id="expires" name="expires" type="date" />
                  </div>
                </div>
                <button type="submit" className="btn-dark">
                  Create promo code
                </button>
              </form>

              <p className="profile-section-label" style={{ marginTop: "56px" }}>
                Active &amp; past codes ({promos.length})
              </p>
              {promos.length === 0 ? (
                <p className="form-fineprint">
                  No promo codes yet. Create one above — customers enter it on the
                  checkout page.
                </p>
              ) : (
                <div className="admin-scroll">
                  <table className="app-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Discount</th>
                        <th>Used</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {promos.map((p) => {
                        const coupon =
                          p.promotion &&
                          typeof p.promotion.coupon === "object"
                            ? p.promotion.coupon
                            : null;
                        return (
                        <tr key={p.id}>
                          <td>
                            <span className="app-name">{p.code}</span>
                          </td>
                          <td>{discountLabel(coupon)}</td>
                          <td>
                            {p.times_redeemed}
                            {p.max_redemptions ? ` / ${p.max_redemptions}` : ""}
                          </td>
                          <td>
                            <span
                              className={`status-pill status-${p.active ? "approved" : "declined"}`}
                            >
                              {p.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <form action={togglePromo}>
                              <input type="hidden" name="id" value={p.id} />
                              <input
                                type="hidden"
                                name="active"
                                value={String(p.active)}
                              />
                              <button type="submit" className="filter-chip">
                                {p.active ? "Deactivate" : "Reactivate"}
                              </button>
                            </form>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
