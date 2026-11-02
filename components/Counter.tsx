"use client";
import { useEffect, useRef, useState } from "react";

export default function Counter({ to, suffix = "", label }: { to: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const run = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(to); return; }
      const t0 = performance.now(), dur = 1800;
      const tick = (t: number) => {
        const p = Math.min((t - t0) / dur, 1);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return (
    <div ref={ref}>
      <p className="font-display text-5xl font-bold text-brand md:text-6xl">{n.toLocaleString("en-IN")}{suffix}</p>
      <p className="mt-2 text-mist">{label}</p>
    </div>
  );
}