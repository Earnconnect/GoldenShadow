"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession } from "@/lib/auth";
import { getCreatorBySlug as getStaticCreatorBySlug } from "@/lib/data";

export type SaveState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function saveProfile(
  _prev: SaveState,
  formData: FormData
): Promise<SaveState> {
  if (!isSupabaseConfigured) {
    return { status: "error", message: "Not connected to the database yet." };
  }

  const session = await getSession();
  if (!session) redirect("/login");

  const slug = session.profile?.creator_slug;
  if (!slug) {
    return {
      status: "error",
      message: "No creator profile is linked to your account yet.",
    };
  }

  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const desc = String(formData.get("desc") ?? "").trim();
  const focus = String(formData.get("focus") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const bio = String(formData.get("bio") ?? "")
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (!name) return { status: "error", message: "Name is required." };

  // Preserve non-editable fields from the static seed so the row stays complete.
  const seed = getStaticCreatorBySlug(slug);
  const supabase = await createClient();

  const { error } = await supabase.from("creators").upsert(
    {
      slug,
      user_id: session.userId,
      updated_at: new Date().toISOString(),
      initial: seed?.initial ?? name.charAt(0).toUpperCase(),
      tag: seed?.tag ?? null,
      category_slug: seed?.categorySlug ?? null,
      name,
      role,
      desc,
      badge: seed?.badge ?? null,
      focus,
      bio,
      projects: seed?.projects ?? [],
    },
    { onConflict: "slug" }
  );

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/creators/${slug}`);
  return {
    status: "success",
    message: "Saved. Your public profile has been updated.",
  };
}

// Creator marks one of their own inquiries handled/new. RLS ("creators update
// own inquiries") guarantees they can only touch inquiries for their own slug.
export async function markInquiryHandled(formData: FormData) {
  if (!isSupabaseConfigured) return;
  const session = await getSession();
  if (!session) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["new", "handled"].includes(status)) return;

  const supabase = await createClient();
  await supabase.from("inquiries").update({ status }).eq("id", id);
  revalidatePath("/dashboard");
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
