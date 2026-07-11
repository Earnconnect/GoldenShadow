"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sendEmail, emailShell, siteUrl, esc } from "@/lib/email";

export async function updateApplicationStatus(formData: FormData) {
  if (!isSupabaseConfigured) return;

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["approved", "declined", "pending"].includes(status)) return;

  const supabase = await createClient();

  // Guard: only an authenticated admin may update.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  // Fetch applicant details before updating (for the notification).
  const { data: app } = await supabase
    .from("applications")
    .select("name, email")
    .eq("id", id)
    .maybeSingle();

  await supabase
    .from("applications")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  // Notify the applicant of an approval/decline (best-effort).
  if (app?.email && (status === "approved" || status === "declined")) {
    const approved = status === "approved";
    await sendEmail({
      to: app.email,
      subject: approved
        ? "Your Golden Shadow application — approved"
        : "Update on your Golden Shadow application",
      html: emailShell(
        approved ? "You're in." : "Application update",
        approved
          ? `<p>Hi ${esc(app.name ?? "there")}, great news — your application to Golden Shadow Publishing has been <strong>approved</strong>. Our team will be in touch shortly with next steps.</p>`
          : `<p>Hi ${esc(app.name ?? "there")}, thank you for applying to Golden Shadow Publishing. After careful review we're not able to move forward at this time — but we'd genuinely welcome a future application as your work grows.</p>`,
        approved ? { label: "Visit Golden Shadow", url: siteUrl() } : undefined
      ),
    });
  }

  revalidatePath("/admin");
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}
