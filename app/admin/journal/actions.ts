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
    .slice(0, 80);
}

function parseBody(raw: string): string[] {
  return raw
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

async function requireAdminClient() {
  if (!isSupabaseConfigured) return null;
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isAdmin(session)) redirect("/dashboard");
  return createAdminClient();
}

export async function createPost(formData: FormData) {
  const admin = await requireAdminClient();
  if (!admin) return;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const slug = slugify(title);

  // Avoid clobbering an existing slug.
  const { data: existing } = await admin
    .from("journal_posts")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    // already exists → send the admin to edit it instead
    redirect(`/admin/journal/${slug}`);
  }

  await admin.from("journal_posts").insert({
    slug,
    title,
    tag: String(formData.get("tag") ?? "").trim() || null,
    excerpt: String(formData.get("excerpt") ?? "").trim() || null,
    body: parseBody(String(formData.get("body") ?? "")),
    date: String(formData.get("date") ?? "").trim() || null,
    read_time: String(formData.get("read_time") ?? "").trim() || null,
    published: formData.get("published") === "on",
  });

  revalidatePath("/admin/journal");
  revalidatePath("/journal");
  redirect(`/admin/journal/${slug}`);
}

export async function updatePost(formData: FormData) {
  const admin = await requireAdminClient();
  if (!admin) return;

  const slug = String(formData.get("slug") ?? "");
  if (!slug) return;

  await admin
    .from("journal_posts")
    .update({
      title: String(formData.get("title") ?? "").trim(),
      tag: String(formData.get("tag") ?? "").trim() || null,
      excerpt: String(formData.get("excerpt") ?? "").trim() || null,
      body: parseBody(String(formData.get("body") ?? "")),
      date: String(formData.get("date") ?? "").trim() || null,
      read_time: String(formData.get("read_time") ?? "").trim() || null,
      published: formData.get("published") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);

  revalidatePath("/admin/journal");
  revalidatePath("/journal");
  revalidatePath(`/journal/${slug}`);
  redirect("/admin/journal");
}

export async function deletePost(formData: FormData) {
  const admin = await requireAdminClient();
  if (!admin) return;
  const slug = String(formData.get("slug") ?? "");
  if (!slug) return;
  await admin.from("journal_posts").delete().eq("slug", slug);
  revalidatePath("/admin/journal");
  revalidatePath("/journal");
  redirect("/admin/journal");
}
