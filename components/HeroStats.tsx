"use client";

import { useEffect, useRef, useState } from "react";

type Stat = {
  value: number;
  prefix?: string;
  suffix?: string;
  suffixSmall?: boolean; // render suffix in the small sans style (e.g. "days")
  label: string;
};

const STATS: Stat[] = [
  { value: 500, suffix: "+", label: "Creators & Executives" },
  { value: 2, prefix: "$", suffix: "M+", label: "IP Revenue Generated" },
  { value: 90, suffix: " days", suffixSmall: true, label: "Avg. Book-to-Market" },
  { value: 100, suffix: "%", label: "IP Ownership Retained" },
];

const DURATION = 1500;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export default function HeroStats() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0); // 0 → 1

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      setProgress(1);
      return;
    }

    let raf = 0;
    let start = 0;
    const animate = (now: number) => {
      if (!start) start = now;
      const t = Math.min((now - start) / DURATION, 1);
      setProgress(easeOut(t));
      if (t < 1) raf = requestAnimationFrame(animate);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          raf = requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="hero-stats" ref={ref}>
      {STATS.map((s) => {
        const current = Math.round(s.value * progress);
        return (
          <div className="stat" key={s.label}>
            <span>
              {s.prefix}
              {current}
              {s.suffix &&
                (s.suffixSmall ? (
                  <span
                    style={{ fontSize: "20px", fontFamily: "var(--sans)" }}
                  >
                    {s.suffix}
                  </span>
                ) : (
                  s.suffix
                ))}
            </span>
            <small>{s.label}</small>
          </div>
        );
      })}
    </div>
  );
}
