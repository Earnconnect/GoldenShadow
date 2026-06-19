"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Client-side auth state for the header so public pages stay static/ISR.
// Logged-in members see a single "Dashboard" link instead of Log In / Apply.
export default function NavAuth() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) setAuthed(!!data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (authed) {
    return (
      <div className="nav-right">
        <Link className="btn-dark" href="/dashboard">
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="nav-right">
      <Link className="nav-sign" href="/login">
        Log In
      </Link>
      <Link className="btn-dark" href="/apply">
        Apply Now
      </Link>
    </div>
  );
}
