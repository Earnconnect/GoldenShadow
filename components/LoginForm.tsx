"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginForm({
  defaultRedirect,
  notConnectedTitle = "Sign-in not connected yet",
  notConnectedBody = "Add your Supabase keys to .env.local and create a user in the Supabase dashboard to enable sign-in.",
}: {
  defaultRedirect: string;
  notConnectedTitle?: string;
  notConnectedBody?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || defaultRedirect;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (!isSupabaseConfigured) {
    return (
      <div className="empty-state">
        <h3>{notConnectedTitle}</h3>
        <p>{notConnectedBody}</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setPending(false);
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="auth-wrap">
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-field">
          <label className="form-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-dark" disabled={pending}>
          {pending ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
