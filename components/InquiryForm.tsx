"use client";

import { useActionState } from "react";
import { submitInquiry, type InquiryState } from "@/app/creators/[slug]/actions";

const initial: InquiryState = { status: "idle", message: "" };

export default function InquiryForm({
  creatorSlug,
  creatorName,
}: {
  creatorSlug: string;
  creatorName: string;
}) {
  const [state, formAction, pending] = useActionState(submitInquiry, initial);

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
        Brands, publishers, and partners — tell us what you have in mind and the
        studio will connect you.
      </p>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label" htmlFor="iq-name">Name *</label>
          <input id="iq-name" name="name" type="text" required maxLength={120} />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="iq-email">Email *</label>
          <input id="iq-email" name="email" type="email" required maxLength={160} />
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
