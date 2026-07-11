"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SetPassword() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (pw.length < 8) return setErr("Use at least 8 characters.");
    if (pw !== pw2) return setErr("Passwords don't match.");

    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="settings-card" style={{ maxWidth: "480px" }}>
      <p className="profile-section-label">Choose a password</p>
      <div className="form-field">
        <label className="form-label" htmlFor="np">New password</label>
        <input
          id="np"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="np2">Confirm password</label>
        <input
          id="np2"
          type="password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>
      {err && <p className="form-error">{err}</p>}
      <button type="submit" className="btn-dark" disabled={busy}>
        {busy ? "Setting up…" : "Set password & continue"}
      </button>
    </form>
  );
}
