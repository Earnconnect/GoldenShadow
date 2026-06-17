"use client";

import { useActionState, useState } from "react";
import { submitApplication, type ApplyState } from "@/app/apply/actions";
import { categories, pricingTiers } from "@/lib/data";

const initialState: ApplyState = { status: "idle", message: "" };

export default function ApplyForm() {
  const [type, setType] = useState<"creator" | "executive">("creator");
  const [state, formAction, pending] = useActionState(
    submitApplication,
    initialState
  );

  // After a successful (or preview) submit, show a confirmation panel.
  if (state.status === "success" || state.status === "preview") {
    return (
      <div className="empty-state">
        <h3>
          {state.status === "success" ? "Application received" : "Form works!"}
        </h3>
        <p>{state.message}</p>
        <a href="/" className="btn-dark">
          Back to Home
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} className="apply-form">
      <input type="hidden" name="type" value={type} />

      <div className="form-field">
        <label className="form-label">I am applying as a *</label>
        <div className="type-toggle">
          <button
            type="button"
            className={`type-option${type === "creator" ? " active" : ""}`}
            onClick={() => setType("creator")}
          >
            <strong>Creator</strong>
            <span>Podcaster, YouTuber, course or audience builder</span>
          </button>
          <button
            type="button"
            className={`type-option${type === "executive" ? " active" : ""}`}
            onClick={() => setType("executive")}
          >
            <strong>Executive</strong>
            <span>Founder, leader, or expert with a body of work</span>
          </button>
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="form-label" htmlFor="name">
            Full name *
          </label>
          <input id="name" name="name" type="text" required maxLength={120} />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="email">
            Email *
          </label>
          <input id="email" name="email" type="email" required maxLength={160} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="form-label" htmlFor="website">
            Website or main platform
          </label>
          <input
            id="website"
            name="website"
            type="text"
            placeholder="https://"
            maxLength={200}
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="category">
            Primary category
          </label>
          <select id="category" name="category" defaultValue="">
            <option value="" disabled>
              Select a category…
            </option>
            {categories.map((c) => (
              <option key={c.slug} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="audience">
          {type === "creator"
            ? "Your audience & platforms"
            : "Your company / role & body of work"}
        </label>
        <input
          id="audience"
          name="audience"
          type="text"
          maxLength={240}
          placeholder={
            type === "creator"
              ? "e.g. 120k podcast listeners, 50k newsletter"
              : "e.g. Founder/CEO, 10 years of operating frameworks"
          }
        />
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="tier_interest">
          Which offering interests you?
        </label>
        <select id="tier_interest" name="tier_interest" defaultValue="">
          <option value="">Not sure yet</option>
          {pricingTiers.map((t) => (
            <option key={t.slug} value={`${t.tier} (${t.amount})`}>
              {t.tier} — {t.amount} {t.per}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="message">
          Tell us about your IP and goals *
        </label>
        <textarea id="message" name="message" rows={5} required maxLength={2000} />
      </div>

      {state.status === "error" && (
        <p className="form-error">{state.message}</p>
      )}

      <button type="submit" className="btn-dark" disabled={pending}>
        {pending ? "Submitting…" : "Submit Application"}
      </button>
      <p className="form-fineprint">
        We review every application to ensure a strong fit. If it&apos;s not the
        right match, we&apos;ll point you to other trusted paths.
      </p>
    </form>
  );
}
