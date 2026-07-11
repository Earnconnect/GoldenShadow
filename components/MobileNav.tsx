"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { navLinks } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Mobile navigation: a hamburger that opens a slide-in panel with the nav
// links and auth-aware actions. Shown only below the desktop breakpoint (CSS).
export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setAuthed(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setAuthed(!!s)
    );
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Lock body scroll while the menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="mobile-nav">
      <button
        type="button"
        className="nav-burger"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      <div
        className={`mobile-menu${open ? " open" : ""}`}
        onClick={close}
        aria-hidden={!open}
      >
        <div className="mobile-menu-panel" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="mobile-menu-close"
            aria-label="Close menu"
            onClick={close}
          >
            &times;
          </button>
          <nav className="mobile-links">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={close}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mobile-menu-actions">
            {authed ? (
              <Link href="/dashboard" className="btn-dark" onClick={close}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-outline" onClick={close}>
                  Log In
                </Link>
                <Link href="/apply" className="btn-dark" onClick={close}>
                  Apply Now
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
