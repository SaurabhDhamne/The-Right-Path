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
    <header className="site-header">
      <div className="header-container">
        <ScrollLink id="home"><Logo /></ScrollLink>
        <nav className="nav-desktop">
          {nav.slice(1).map((n) => (
            <ScrollLink
              key={n.id}
              id={n.id}
              className={`nav-link ${active === n.id ? "nav-link-active" : "nav-link-inactive"}`}
            >
              {n.label}
            </ScrollLink>
          ))}
        </nav>
        <ScrollLink id="contact" className="btn-cta">Get guidance</ScrollLink>
        <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)} className="menu-toggle">
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <nav className="nav-mobile" onClick={() => setOpen(false)}>
          {nav.map((n) => (
            <ScrollLink key={n.id} id={n.id} className="py-1 font-medium">
              {n.label}
            </ScrollLink>
          ))}
        </nav>
      )}
      <div className="scroll-progress-bar" style={{ width: `${progress}%` }} />
    </header>
  );
}
