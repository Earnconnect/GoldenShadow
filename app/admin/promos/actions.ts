"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getSession, isAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isAdmin(session)) redirect("/dashboard");
}

export async function createPromo(formData: FormData) {
  await requireAdmin();
  if (!isStripeConfigured) redirect("/admin/promos");
  const stripe = getStripe();
  if (!stripe) redirect("/admin/promos");

  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  const kind = String(formData.get("kind") ?? "percent");
  const value = Number(formData.get("value") ?? 0);
  const duration = String(formData.get("duration") ?? "once");
  const maxRedemptions = Number(formData.get("max_redemptions") ?? 0);
  const expires = String(formData.get("expires") ?? "").trim();

  if (!value || value <= 0) {
    redirect("/admin/promos?err=" + encodeURIComponent("Enter a discount value."));
  }
  if (kind === "percent" && value > 100) {
    redirect("/admin/promos?err=" + encodeURIComponent("Percent can't exceed 100."));
  }

  let notice = "";
  try {
    const couponParams: Stripe.CouponCreateParams =
      kind === "amount"
        ? {
            duration: duration === "forever" ? "forever" : "once",
            amount_off: Math.round(value * 100),
            currency: "usd",
          }
        : {
            duration: duration === "forever" ? "forever" : "once",
            percent_off: value,
          };
    const coupon = await stripe!.coupons.create(couponParams);

    const promoParams: Stripe.PromotionCodeCreateParams = {
      promotion: { type: "coupon", coupon: coupon.id },
    };
    if (code) promoParams.code = code;
    if (maxRedemptions > 0) promoParams.max_redemptions = maxRedemptions;
    if (expires) {
      const ts = Math.floor(new Date(`${expires}T23:59:59Z`).getTime() / 1000);
      if (ts > Math.floor(Date.now() / 1000)) promoParams.expires_at = ts;
    }
    const promo = await stripe!.promotionCodes.create(promoParams);

    await logActivity({
      action: "promo.created",
      actor: "admin",
      detail: `${promo.code} — ${
        kind === "amount" ? `$${value} off` : `${value}% off`
      }`,
    });
    notice = "ok";
  } catch (e) {
    notice = e instanceof Error ? e.message : "Could not create the promo code.";
  }

  revalidatePath("/admin/promos");
  redirect(
    notice === "ok"
      ? "/admin/promos?ok=1"
      : "/admin/promos?err=" + encodeURIComponent(notice)
  );
}

export async function togglePromo(formData: FormData) {
  await requireAdmin();
  const stripe = getStripe();
  if (!stripe) return;

  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return;

  try {
    await stripe.promotionCodes.update(id, { active: !active });
    await logActivity({
      action: "promo.toggled",
      actor: "admin",
      detail: `${id} → ${!active ? "active" : "inactive"}`,
    });
  } catch {
    // best-effort
  }
  revalidatePath("/admin/promos");
}
