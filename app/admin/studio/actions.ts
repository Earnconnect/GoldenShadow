"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Set the editorial review status/note on a creator's artifact.
// Admin-only; writes via the service-role client because ai_artifacts update
// RLS is owner-only (we never loosen that).
export async function setArtifactReview(formData: FormData) {
  if (!isSupabaseConfigured) return;

  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isAdmin(session)) redirect("/dashboard");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!id || !["approved", "needs_work", "pending"].includes(status)) return;

  const admin = createAdminClient();
  if (!admin) return; // service-role key not set

  await admin
    .from("ai_artifacts")
    .update({
      review_status: status,
      review_note: note || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/studio");
}
