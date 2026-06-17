"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function saveSettings(formData: FormData) {
  if (!isSupabaseConfigured) return;
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isAdmin(session)) redirect("/dashboard");

  const admin = createAdminClient();
  if (!admin) return;

  const now = new Date().toISOString();
  const rows = [
    { key: "hero_eyebrow", value: String(formData.get("hero_eyebrow") ?? "").trim() },
    { key: "hero_subtitle", value: String(formData.get("hero_subtitle") ?? "").trim() },
    { key: "contact_email", value: String(formData.get("contact_email") ?? "").trim() },
    {
      key: "applications_open",
      value: formData.get("applications_open") === "on" ? "true" : "false",
    },
  ].map((r) => ({ ...r, updated_at: now }));

  await admin.from("site_settings").upsert(rows, { onConflict: "key" });

  revalidatePath("/");
  revalidatePath("/apply");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}
