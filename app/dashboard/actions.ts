"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession } from "@/lib/auth";
import { getCreatorBySlug as getStaticCreatorBySlug } from "@/lib/data";
import { sendEmail, emailShell, siteUrl, esc } from "@/lib/email";

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

// Post a reply into a conversation thread. RLS ("participants post messages")
// guarantees the user is part of the thread; we just label the role.
export async function postInquiryMessage(formData: FormData) {
  if (!isSupabaseConfigured) return;
  const session = await getSession();
  if (!session) redirect("/login");

  const inquiryId = String(formData.get("inquiry_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!inquiryId || body.length < 1) return;

  const supabase = await createClient();

  // RLS only lets a participant read the thread → tells us our role.
  const { data: inq } = await supabase
    .from("inquiries")
    .select("creator_slug, sender_user_id")
    .eq("id", inquiryId)
    .maybeSingle();
  if (!inq) return;

  const isCreator =
    !!inq.creator_slug && inq.creator_slug === session.profile?.creator_slug;
  const role = isCreator ? "creator" : "member";

  await supabase.from("inquiry_messages").insert({
    inquiry_id: inquiryId,
    sender_user_id: session.userId,
    sender_role: role,
    body: body.slice(0, 2000),
  });
  // Surface the new reply to the other party as "new".
  await supabase.from("inquiries").update({ status: "new" }).eq("id", inquiryId);

  // Email the other participant (best-effort).
  try {
    const admin = createAdminClient();
    if (admin) {
      let otherUserId: string | null = null;
      if (isCreator) {
        otherUserId = inq.sender_user_id ?? null;
      } else if (inq.creator_slug) {
        const { data: cr } = await admin
          .from("creators")
          .select("user_id")
          .eq("slug", inq.creator_slug)
          .maybeSingle();
        otherUserId = cr?.user_id ?? null;
      }
      if (otherUserId) {
        const { data: u } = await admin.auth.admin.getUserById(otherUserId);
        const to = u?.user?.email ?? null;
        const fromName =
          session.profile?.full_name || session.email || "Someone";
        if (to)
          await sendEmail({
            to,
            subject: `New message from ${fromName}`,
            html: emailShell(
              "You have a new message",
              `<p><strong>${esc(fromName)}</strong> replied to your conversation:</p><p style="white-space:pre-wrap">${esc(
                body.slice(0, 600)
              )}</p>`,
              { label: "Open conversation", url: `${siteUrl()}/dashboard` }
            ),
          });
      }
    }
  } catch {
    // best-effort
  }

  revalidatePath("/dashboard");
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
