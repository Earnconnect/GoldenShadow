"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
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
  const [auth, setAuth] = useState<"loading" | "in" | "out">("loading");
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");

  // Resolve sign-in state client-side so the profile page stays static/ISR.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuth("out");
      return;
    }
    const supabase = createClient();
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setAuth("out");
        return;
      }
      setMemberEmail(user.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      setMemberName(
        (profile as { full_name: string | null } | null)?.full_name ??
          user.email ??
          ""
      );
      setAuth("in");
    })();
    return () => {
      active = false;
    };
  }, []);

  if (state.status === "success" || state.status === "preview") {
    return (
      <div className="empty-state">
        <h3>Message sent</h3>
        <p>{state.message}</p>
        <Link href="/dashboard" className="btn-dark">
          Go to your conversations
        </Link>
      </div>
    );
  }

  if (auth === "loading") {
    return <p className="form-fineprint">Loading…</p>;
  }

  // Login required so the whole conversation stays on-platform.
  if (auth === "out") {
    return (
      <div className="empty-state">
        <h3>Work with {creatorName}</h3>
        <p>
          Log in to message {creatorName} directly — your conversation lives in
          your dashboard, replies and all.
        </p>
        <div
          style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}
        >
          <Link href="/login" className="btn-dark">
            Log in
          </Link>
          <Link href="/apply" className="btn-outline">
            Apply to join
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="apply-form inquiry-form">
      <input type="hidden" name="creator_slug" value={creatorSlug} />
      <p className="profile-section-label">Message {creatorName}</p>
      <p className="form-fineprint" style={{ marginTop: "-8px" }}>
        Contacting as <strong>{memberName}</strong>
        {memberEmail ? ` · ${memberEmail}` : ""}. Your conversation appears in
        your dashboard.
      </p>
      <div className="form-field">
        <label className="form-label" htmlFor="iq-company">
          Company / organization <span className="label-hint">(optional)</span>
        </label>
        <input id="iq-company" name="company" type="text" maxLength={160} />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="iq-message">Message *</label>
        <textarea id="iq-message" name="message" rows={4} required maxLength={1500} />
      </div>
      {state.status === "error" && <p className="form-error">{state.message}</p>}
      <button type="submit" className="btn-dark" disabled={pending}>
        {pending ? "Sending…" : `Send to ${creatorName}`}
      </button>
    </form>
  );
}
