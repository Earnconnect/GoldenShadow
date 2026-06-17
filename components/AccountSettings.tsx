"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Msg = { kind: "ok" | "err"; text: string } | null;

export default function AccountSettings({
  userId,
  initialName,
  initialEmail,
}: {
  userId: string;
  initialName: string;
  initialEmail: string;
}) {
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [nameMsg, setNameMsg] = useState<Msg>(null);
  const [nameBusy, setNameBusy] = useState(false);

  const [email, setEmail] = useState(initialEmail);
  const [emailMsg, setEmailMsg] = useState<Msg>(null);
  const [emailBusy, setEmailBusy] = useState(false);

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState<Msg>(null);
  const [pwBusy, setPwBusy] = useState(false);

  if (!isSupabaseConfigured) {
    return (
      <div className="empty-state">
        <h3>Settings unavailable</h3>
        <p>Account settings activate once the platform is connected.</p>
      </div>
    );
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameBusy(true);
    setNameMsg(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name.trim() || null })
      .eq("id", userId);
    setNameMsg(
      error
        ? { kind: "err", text: error.message }
        : { kind: "ok", text: "Saved." }
    );
    setNameBusy(false);
    if (!error) router.refresh();
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailBusy(true);
    setEmailMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    setEmailMsg(
      error
        ? { kind: "err", text: error.message }
        : {
            kind: "ok",
            text: "Confirmation sent — check your new inbox to finish the change.",
          }
    );
    setEmailBusy(false);
  }

  async function savePw(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8)
      return setPwMsg({ kind: "err", text: "Use at least 8 characters." });
    if (pw !== pw2)
      return setPwMsg({ kind: "err", text: "Passwords don't match." });
    setPwBusy(true);
    setPwMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) setPwMsg({ kind: "err", text: error.message });
    else {
      setPwMsg({ kind: "ok", text: "Password updated." });
      setPw("");
      setPw2("");
    }
    setPwBusy(false);
  }

  const note = (m: Msg) =>
    m && (
      <p className={m.kind === "err" ? "form-error" : "form-success"}>
        {m.text}
      </p>
    );

  return (
    <div className="settings-stack">
      <form onSubmit={saveName} className="settings-card">
        <p className="profile-section-label">Display name</p>
        <div className="form-field">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            placeholder="Your name"
          />
        </div>
        {note(nameMsg)}
        <button type="submit" className="btn-dark" disabled={nameBusy}>
          {nameBusy ? "Saving…" : "Save name"}
        </button>
      </form>

      <form onSubmit={saveEmail} className="settings-card">
        <p className="profile-section-label">Email address</p>
        <div className="form-field">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={160}
            required
          />
        </div>
        <p className="form-fineprint" style={{ marginTop: "-4px" }}>
          Changing your email sends a confirmation link to the new address.
        </p>
        {note(emailMsg)}
        <button type="submit" className="btn-dark" disabled={emailBusy}>
          {emailBusy ? "Sending…" : "Update email"}
        </button>
      </form>

      <form onSubmit={savePw} className="settings-card">
        <p className="profile-section-label">Password</p>
        <div className="form-row">
          <div className="form-field">
            <label className="form-label" htmlFor="np">New password</label>
            <input
              id="np"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="np2">Confirm</label>
            <input
              id="np2"
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>
        {note(pwMsg)}
        <button type="submit" className="btn-dark" disabled={pwBusy}>
          {pwBusy ? "Updating…" : "Change password"}
        </button>
      </form>
    </div>
  );
}
