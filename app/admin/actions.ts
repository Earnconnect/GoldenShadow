"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // Approval → invite them to self-register (set their own password).
  if (app?.email && status === "approved") {
    // Generate a single-use registration link and embed it in the email.
    let cta = { label: "Get started", url: siteUrl() };
    try {
      const admin = createAdminClient();
      if (admin) {
        let hashed: string | undefined;
        let linkType: "invite" | "recovery" = "invite";
        // New applicants → invite (creates the account). If they somehow
        // already have an account, fall back to a recovery link.
        const inv = await admin.auth.admin.generateLink({
          type: "invite",
          email: app.email,
        });
        if (!inv.error && inv.data?.properties?.hashed_token) {
          hashed = inv.data.properties.hashed_token;
        } else {
          const rec = await admin.auth.admin.generateLink({
            type: "recovery",
            email: app.email,
          });
          hashed = rec.data?.properties?.hashed_token;
          linkType = "recovery";
        }
        if (hashed) {
          cta = {
            label: "Complete your registration",
            url: `${siteUrl()}/auth/confirm?token_hash=${hashed}&type=${linkType}&next=/welcome`,
          };
        }
      }
    } catch {
      // best-effort — fall back to the plain "Get started" link
    }

    await sendEmail({
      to: app.email,
      subject: "You're approved — complete your Golden Shadow registration",
      html: emailShell(
        "Welcome — you're approved.",
        `<p>Hi ${esc(app.name ?? "there")}, great news — your application to Golden Shadow Publishing has been <strong>approved</strong>.</p>
         <p>Click below to set your password and start using the platform.</p>`,
        cta
      ),
    });
  } else if (app?.email && status === "declined") {
    await sendEmail({
      to: app.email,
      subject: "Update on your Golden Shadow application",
      html: emailShell(
        "Application update",
        `<p>Hi ${esc(app.name ?? "there")}, thank you for applying to Golden Shadow Publishing. After careful review we're not able to move forward at this time — but we'd genuinely welcome a future application as your work grows.</p>`
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
