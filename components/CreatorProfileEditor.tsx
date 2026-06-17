"use client";

import { useActionState } from "react";
import { saveProfile, type SaveState } from "@/app/dashboard/actions";
import type { Creator } from "@/lib/data";

const initialState: SaveState = { status: "idle", message: "" };

export default function CreatorProfileEditor({
  creator,
}: {
  creator: Creator;
}) {
  const [state, formAction, pending] = useActionState(
    saveProfile,
    initialState
  );

  return (
    <form action={formAction} className="apply-form">
      {state.status === "success" && (
        <p className="form-success">{state.message}</p>
      )}
      {state.status === "error" && <p className="form-error">{state.message}</p>}

      <div className="form-row">
        <div className="form-field">
          <label className="form-label" htmlFor="name">
            Display name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={creator.name}
            required
            maxLength={120}
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="role">
            Role / title
          </label>
          <input
            id="role"
            name="role"
            type="text"
            defaultValue={creator.role}
            maxLength={160}
          />
        </div>
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="desc">
          Short tagline
        </label>
        <textarea
          id="desc"
          name="desc"
          rows={2}
          defaultValue={creator.desc}
          maxLength={400}
        />
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="focus">
          Areas of focus <span className="label-hint">(comma-separated)</span>
        </label>
        <input
          id="focus"
          name="focus"
          type="text"
          defaultValue={creator.focus.join(", ")}
          maxLength={300}
        />
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="bio">
          Bio <span className="label-hint">(blank line between paragraphs)</span>
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={8}
          defaultValue={creator.bio.join("\n\n")}
          maxLength={4000}
        />
      </div>

      <button type="submit" className="btn-dark" disabled={pending}>
        {pending ? "Saving…" : "Save Profile"}
      </button>
    </form>
  );
}
