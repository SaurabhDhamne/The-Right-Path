"use client";
import { useEffect, useState } from "react";
import { nav } from "@/lib/site";
import ScrollLink from "./ScrollLink";
import Logo from "./Logo";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => setProgress((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-40% 0px -55% 0px" }
    );
    nav.forEach((n) => { const el = document.getElementById(n.id); if (el) io.observe(el); });
    return () => { window.removeEventListener("scroll", onScroll); io.disconnect(); };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white text-ink shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-1">
        <ScrollLink id="home"><Logo /></ScrollLink>
        <nav className="hidden gap-6 text-sm font-semibold lg:flex">
          {nav.slice(1).map((n) => (
            <ScrollLink key={n.id} id={n.id} className={`border-b-2 py-1 transition-colors ${active === n.id ? "border-brand text-ink" : "border-transparent text-ink/60 hover:text-ink"}`}>
              {n.label}
            </ScrollLink>
          ))}
        </nav>
        <ScrollLink id="contact" className="hidden rounded-full bg-brand px-5 py-2 text-sm font-bold text-ink lg:block">Get guidance</ScrollLink>
        <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)} className="font-semibold lg:hidden">{open ? "Close" : "Menu"}</button>
      </div>
      {open && (
        <nav className="flex flex-col gap-4 border-t border-ink/10 px-5 py-4 lg:hidden" onClick={() => setOpen(false)}>
          {nav.map((n) => <ScrollLink key={n.id} id={n.id}>{n.label}</ScrollLink>)}
        </nav>
      )}
      <div className="absolute bottom-0 left-0 h-0.5 bg-brand" style={{ width: `${progress}%` }} />
    </header>
  );
}