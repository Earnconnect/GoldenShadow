"use client";

import { useActionState, useEffect, useState } from "react";
import { submitInquiry, type InquiryState } from "@/app/creators/[slug]/actions";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const initial: InquiryState = { status: "idle", message: "" };

export default function InquiryForm({
  creatorSlug,
  creatorName,
}: {
  creatorSlug: string;
  creatorName: string;
}) {
  const [state, formAction, pending] = useActionState(submitInquiry, initial);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [memberEmail, setMemberEmail] = useState<string | null>(null);

  // Pre-fill from the signed-in member's account (client-side keeps this page static).
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active || !user) return;
      setEmail(user.email ?? "");
      setMemberEmail(user.email ?? null);
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      const fullName = (profile as { full_name: string | null } | null)?.full_name;
      if (fullName) setName(fullName);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (state.status === "success" || state.status === "preview") {
    return (
      <div className="empty-state">
        <h3>Thank you</h3>
        <p>{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="apply-form inquiry-form">
      <input type="hidden" name="creator_slug" value={creatorSlug} />
      <p className="profile-section-label">Work with {creatorName}</p>
      <p className="form-fineprint" style={{ marginTop: "-8px" }}>
        {memberEmail
          ? `Send ${creatorName} a message and the studio will connect you.`
          : "Brands, publishers, and partners — tell us what you have in mind and the studio will connect you."}
      </p>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label" htmlFor="iq-name">Name *</label>
          <input
            id="iq-name"
            name="name"
            type="text"
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="iq-email">Email *</label>
          <input
            id="iq-email"
            name="email"
            type="email"
            required
            maxLength={160}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="iq-company">Company / organization</label>
        <input id="iq-company" name="company" type="text" maxLength={160} />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="iq-message">Message *</label>
        <textarea id="iq-message" name="message" rows={4} required maxLength={1500} />
      </div>
      {state.status === "error" && <p className="form-error">{state.message}</p>}
      <button type="submit" className="btn-dark" disabled={pending}>
        {pending ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}
