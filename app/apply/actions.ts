"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sendEmail, emailShell, studioInbox, siteUrl, esc } from "@/lib/email";
import { logActivity } from "@/lib/activity";

export type ApplyState = {
  status: "idle" | "success" | "error" | "preview";
  message: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitApplication(
  _prev: ApplyState,
  formData: FormData
): Promise<ApplyState> {
  const type = String(formData.get("type") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const tierInterest = String(formData.get("tier_interest") ?? "").trim();
  const audience = String(formData.get("audience") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  // ── Validation ──────────────────────────────────────────────
  if (type !== "creator" && type !== "executive") {
    return { status: "error", message: "Please choose Creator or Executive." };
  }
  if (!name) return { status: "error", message: "Please enter your name." };
  if (!EMAIL_RE.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }
  if (message.length < 10) {
    return {
      status: "error",
      message: "Please tell us a little more (at least a sentence or two).",
    };
  }

  // ── Preview mode (no Supabase keys yet) ─────────────────────
  if (!isSupabaseConfigured) {
    return {
      status: "preview",
      message:
        "Thanks! The form is working — but the database isn't connected yet. Add your Supabase keys to start saving applications.",
    };
  }

  // ── Persist to Supabase ─────────────────────────────────────
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("applications").insert({
      type,
      name,
      email,
      website: website || null,
      category: category || null,
      tier_interest: tierInterest || null,
      audience: audience || null,
      message,
    });

    if (error) {
      return {
        status: "error",
        message:
          "Something went wrong saving your application. Please try again.",
      };
    }

    // Notify the studio (best-effort).
    const inbox = await studioInbox();
    if (inbox) {
      await sendEmail({
        to: inbox,
        replyTo: email,
        subject: `New ${type} application — ${name}`,
        html: emailShell(
          "New application received",
          `<p><strong>${esc(name)}</strong> (${esc(email)}) applied as a <strong>${esc(
            type
          )}</strong>.</p>${
            category ? `<p>Category: ${esc(category)}</p>` : ""
          }${tierInterest ? `<p>Interested in: ${esc(tierInterest)}</p>` : ""}
          <p style="white-space:pre-wrap">${esc(message)}</p>`,
          { label: "Review in admin", url: `${siteUrl()}/admin` }
        ),
      });
    }

    await logActivity({
      action: "application.submitted",
      actor: email,
      detail: `${name} applied as ${type}`,
    });

    return {
      status: "success",
      message:
        "Application received. We review every submission and will be in touch if it's a strong fit.",
    };
  } catch {
    return {
      status: "error",
      message: "Unexpected error. Please try again in a moment.",
    };
  }
}
