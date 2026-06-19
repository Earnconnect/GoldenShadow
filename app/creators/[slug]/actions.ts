"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type InquiryState = {
  status: "idle" | "success" | "error" | "preview";
  message: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitInquiry(
  _prev: InquiryState,
  formData: FormData
): Promise<InquiryState> {
  const creatorSlug = String(formData.get("creator_slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name) return { status: "error", message: "Please enter your name." };
  if (!EMAIL_RE.test(email))
    return { status: "error", message: "Please enter a valid email." };
  if (message.length < 10)
    return { status: "error", message: "Please add a short message." };

  if (!isSupabaseConfigured) {
    return {
      status: "preview",
      message:
        "Thanks! This form works — connect the database to start collecting inquiries.",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("inquiries").insert({
      creator_slug: creatorSlug || null,
      name,
      email,
      company: company || null,
      message,
    });
    if (error)
      return { status: "error", message: "Something went wrong. Try again." };
    return {
      status: "success",
      message: "Sent! Your message has been delivered — expect a reply by email.",
    };
  } catch {
    return { status: "error", message: "Unexpected error. Please try again." };
  }
}
