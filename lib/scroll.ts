// Eased smooth-scroll to a section id, offset for the sticky header.
export function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 72;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { window.scrollTo(0, y); return; }
  const start = window.scrollY, dist = y - start, t0 = performance.now();
  const dur = Math.min(1200, 500 + Math.abs(dist) * 0.25);
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const step = (now: number) => {
    const p = Math.min((now - t0) / dur, 1);
    window.scrollTo(0, start + dist * ease(p));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  history.replaceState(null, "", `#${id}`);
}
