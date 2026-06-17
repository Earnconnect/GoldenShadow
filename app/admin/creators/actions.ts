"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const splitCommas = (s: string) =>
  s.split(",").map((x) => x.trim()).filter(Boolean);
const splitParas = (s: string) =>
  s.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);

async function requireAdminClient() {
  if (!isSupabaseConfigured) return null;
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isAdmin(session)) redirect("/dashboard");
  return createAdminClient();
}

export async function saveCreator(formData: FormData) {
  const admin = await requireAdminClient();
  if (!admin) return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const existingSlug = String(formData.get("slug") ?? "").trim();
  const slug = existingSlug || slugify(name);

  // Preserve projects (not edited here) from any existing row.
  const { data: existing } = await admin
    .from("creators")
    .select("projects")
    .eq("slug", slug)
    .maybeSingle();

  await admin.from("creators").upsert(
    {
      slug,
      name,
      initial:
        String(formData.get("initial") ?? "").trim() ||
        name.charAt(0).toUpperCase(),
      role: String(formData.get("role") ?? "").trim() || null,
      tag: String(formData.get("tag") ?? "").trim() || null,
      category_slug: String(formData.get("category_slug") ?? "").trim() || null,
      desc: String(formData.get("desc") ?? "").trim() || null,
      badge: String(formData.get("badge") ?? "").trim() || null,
      focus: splitCommas(String(formData.get("focus") ?? "")),
      bio: splitParas(String(formData.get("bio") ?? "")),
      projects: existing?.projects ?? [],
      featured: formData.get("featured") === "on",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "slug" }
  );

  revalidatePath("/admin/creators");
  revalidatePath("/creators");
  revalidatePath(`/creators/${slug}`);
  revalidatePath("/");
  redirect("/admin/creators");
}

export async function toggleFeatured(formData: FormData) {
  const admin = await requireAdminClient();
  if (!admin) return;
  const slug = String(formData.get("slug") ?? "");
  const featured = formData.get("featured") === "true";
  if (!slug) return;

  // Upsert so a static-roster creator without a DB row can still be featured.
  const { data: existing } = await admin
    .from("creators")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    await admin.from("creators").update({ featured }).eq("slug", slug);
  }
  revalidatePath("/admin/creators");
  revalidatePath("/creators");
  revalidatePath("/");
}
