"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdminClient() {
  if (!isSupabaseConfigured) return null;
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isAdmin(session)) redirect("/dashboard");
  return createAdminClient();
}

export async function updateUser(formData: FormData) {
  const admin = await requireAdminClient();
  if (!admin) return;

  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "creator");
  const plan = String(formData.get("plan") ?? "none");
  const creatorSlug = String(formData.get("creator_slug") ?? "").trim();
  if (!id) return;
  if (!["creator", "admin"].includes(role)) return;
  if (!["none", "starter", "studio", "platform"].includes(plan)) return;

  await admin
    .from("profiles")
    .update({
      role,
      plan,
      creator_slug: creatorSlug || null,
    })
    .eq("id", id);

  revalidatePath("/admin/users");
}

export async function inviteUser(formData: FormData) {
  const admin = await requireAdminClient();
  if (!admin) redirect("/admin/users");

  const email = String(formData.get("email") ?? "").trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/admin/users?notice=" + encodeURIComponent("Enter a valid email."));
  }

  // Compute the notice inside try/catch, then redirect afterward — redirect()
  // throws a control-flow signal and must not be caught.
  let notice: string;
  try {
    const { error } = await admin.auth.admin.inviteUserByEmail(email);
    notice = error
      ? `Couldn't invite: ${error.message}`
      : `Invite sent to ${email}.`;
  } catch {
    notice = "Invite failed (email may not be configured in Supabase).";
  }

  revalidatePath("/admin/users");
  redirect("/admin/users?notice=" + encodeURIComponent(notice));
}
