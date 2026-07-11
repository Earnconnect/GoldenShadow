"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession } from "@/lib/auth";
import { sendEmail, emailShell, studioInbox, siteUrl, esc } from "@/lib/email";
import { logActivity } from "@/lib/activity";

export type InquiryState = {
  status: "idle" | "success" | "error" | "preview";
  message: string;
};

export async function submitInquiry(
  _prev: InquiryState,
  formData: FormData
): Promise<InquiryState> {
  const creatorSlug = String(formData.get("creator_slug") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (message.length < 10)
    return { status: "error", message: "Please add a short message." };

  if (!isSupabaseConfigured) {
    return {
      status: "preview",
      message:
        "Thanks! This form works — connect the database to start the conversation.",
    };
  }

  // Login required — the conversation lives on-platform, in both dashboards.
  const session = await getSession();
  if (!session) {
    return {
      status: "error",
      message: "Please log in to message this creator.",
    };
  }

  const name =
    session.profile?.full_name?.trim() || session.email || "Member";
  const email = session.email ?? "";

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("inquiries").insert({
      creator_slug: creatorSlug || null,
      sender_user_id: session.userId,
      name,
      email,
      company: company || null,
      message,
    });
    if (error)
      return { status: "error", message: "Something went wrong. Try again." };

    await logActivity({
      action: "inquiry.sent",
      userId: session.userId,
      actor: name,
      detail: `messaged ${creatorSlug || "a creator"}`,
      entity: creatorSlug || null,
    });

    // Notify the creator (if they have an account) + the studio backstop.
    try {
      const admin = createAdminClient();
      let creatorEmail: string | null = null;
      if (admin && creatorSlug) {
        const { data: cr } = await admin
          .from("creators")
          .select("user_id")
          .eq("slug", creatorSlug)
          .maybeSingle();
        if (cr?.user_id) {
          const { data: u } = await admin.auth.admin.getUserById(cr.user_id);
          creatorEmail = u?.user?.email ?? null;
        }
      }
      const inbox = await studioInbox();
      const html = emailShell(
        "New partnership request",
        `<p><strong>${esc(name)}</strong>${
          company ? ` (${esc(company)})` : ""
        } wants to work with you:</p><p style="white-space:pre-wrap">${esc(
          message
        )}</p>`,
        { label: "Open your conversations", url: `${siteUrl()}/dashboard` }
      );
      if (creatorEmail)
        await sendEmail({
          to: creatorEmail,
          replyTo: email || undefined,
          subject: `New partnership request from ${name}`,
          html,
        });
      if (inbox && inbox !== creatorEmail)
        await sendEmail({
          to: inbox,
          replyTo: email || undefined,
          subject: `New inquiry for ${creatorSlug || "a creator"} — ${name}`,
          html,
        });
    } catch {
      // best-effort
    }

    return {
      status: "success",
      message:
        "Sent! Your message is in your dashboard under “My Conversations” — replies appear there.",
    };
  } catch {
    return { status: "error", message: "Unexpected error. Please try again." };
  }
}
