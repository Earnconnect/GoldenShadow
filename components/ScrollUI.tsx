"use client";

import { useEffect, useState } from "react";

// Page chrome that reacts to scroll: a top progress bar, a nav-shadow flag on
// <html>, and a back-to-top button. Mounted once in the root layout.
export default function ScrollUI() {
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const top = window.scrollY;
      setProgress(max > 0 ? top / max : 0);
      setShowTop(top > 640);
      if (top > 8) doc.setAttribute("data-scrolled", "true");
      else doc.removeAttribute("data-scrolled");
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      document.documentElement.removeAttribute("data-scrolled");
    };
  }, []);

  return (
    <>
      <div
        className="scroll-progress"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden="true"
      />
      <button
        className={`back-to-top${showTop ? " show" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        tabIndex={showTop ? 0 : -1}
      >
        ↑
      </button>
    </>
  );
}
