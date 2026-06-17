import { createPublicClient } from "@/lib/supabase/public";

export type SiteSettings = {
  heroEyebrow: string;
  heroSubtitle: string;
  contactEmail: string;
  applicationsOpen: boolean;
};

export const SETTINGS_DEFAULTS: SiteSettings = {
  heroEyebrow: "The IP Marketplace for Creators & Executives · Est. 2026",
  heroSubtitle:
    "Golden Shadow Publishing is the marketplace where creators and executives turn intellectual property into books, products, and enduring revenue — no algorithms, just authentic partnerships and real assets.",
  contactEmail: "hello@goldenshadowhouse.com",
  applicationsOpen: true,
};

// DB keys ↔ object fields.
export const SETTING_KEYS = {
  hero_eyebrow: "heroEyebrow",
  hero_subtitle: "heroSubtitle",
  contact_email: "contactEmail",
  applications_open: "applicationsOpen",
} as const;

// Reads the site settings, merged over defaults. Cookieless → ISR-friendly.
export async function getSettings(): Promise<SiteSettings> {
  const supabase = createPublicClient();
  if (!supabase) return SETTINGS_DEFAULTS;

  const { data } = await supabase.from("site_settings").select("key, value");
  if (!data) return SETTINGS_DEFAULTS;

  const map = new Map(
    (data as { key: string; value: string | null }[]).map((r) => [
      r.key,
      r.value ?? "",
    ])
  );

  return {
    heroEyebrow: map.get("hero_eyebrow") || SETTINGS_DEFAULTS.heroEyebrow,
    heroSubtitle: map.get("hero_subtitle") || SETTINGS_DEFAULTS.heroSubtitle,
    contactEmail: map.get("contact_email") || SETTINGS_DEFAULTS.contactEmail,
    applicationsOpen:
      (map.get("applications_open") ?? "true") !== "false",
  };
}
