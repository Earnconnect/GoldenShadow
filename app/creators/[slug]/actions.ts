"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession } from "@/lib/auth";

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
    return {
      status: "success",
      message:
        "Sent! Your message is in your dashboard under “My Conversations” — replies appear there.",
    };
  } catch {
    return { status: "error", message: "Unexpected error. Please try again." };
  }
}
