"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { nav } from "@/lib/site";
import { supabase } from "@/lib/supabase";
import ScrollLink from "./ScrollLink";
import Logo from "./Logo";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");
  const [progress, setProgress] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () =>
      setProgress(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-40% 0px -55% 0px" }
    );
    nav.forEach((n) => {
      const el = document.getElementById(n.id);
      if (el) io.observe(el);
    });

    // Auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user || null)
    );

    // Close dropdown on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
      authListener?.subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    setUser(null);
  };

  // Build display info from user object
  const displayName: string =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";
  const displayEmail: string = user?.email || "";
  const shortUid: string = user ? `RP-${user.id.slice(0, 6).toUpperCase()}` : "";

  // Generate initials for avatar
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="site-header">
      <div className="header-container">
        <ScrollLink id="home" className="brand-link">
          <Logo />
        </ScrollLink>

        <nav className="nav-desktop">
          {nav.slice(1).map((n) => (
            <ScrollLink
              key={n.id}
              id={n.id}
              className={`nav-link ${
                active === n.id ? "nav-link-active" : "nav-link-inactive"
              }`}
            >
              {n.label}
            </ScrollLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ScrollLink id="contact" className="btn-cta">
            Get guidance
          </ScrollLink>

          {user ? (
            /* ── Logged-in: Avatar + Dropdown ── */
            <div className="relative hidden lg:block" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="Open profile menu"
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-brand transition-all group"
              >
                {/* Avatar circle with initials */}
                <span className="w-9 h-9 rounded-full bg-ink text-white text-sm font-bold flex items-center justify-center group-hover:bg-navy transition-colors select-none">
                  {initials}
                </span>
                {/* Chevron */}
                <svg
                  className={`w-3.5 h-3.5 text-ink/60 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown panel */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl shadow-ink/15 border border-ink/10 overflow-hidden z-50">
                  {/* User info header */}
                  <div className="p-4 bg-ink text-white">
                    <div className="flex items-center gap-3">
                      <span className="w-12 h-12 rounded-full bg-brand text-ink text-lg font-bold flex items-center justify-center select-none flex-shrink-0">
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-base text-white truncate">{displayName}</p>
                        <p className="text-xs text-white/70 truncate">{displayEmail}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-white/10 font-mono text-[10px] text-white/80">
                          {shortUid}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-2">
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-ink hover:bg-paper transition-colors"
                    >
                      <svg className="w-4 h-4 text-ink/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      Dashboard
                      <span className="ml-auto w-2 h-2 rounded-full bg-brand animate-pulse" />
                    </Link>

                    <div className="my-2 border-t border-ink/8" />

                    {/* User detail rows */}
                    <div className="px-3 py-2 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink/50 font-medium">Member ID</span>
                        <span className="font-mono font-bold text-ink text-[11px] bg-paper px-2 py-0.5 rounded border border-ink/10">{shortUid}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink/50 font-medium">Role</span>
                        <span className="font-bold text-ink capitalize">Admin</span>
                      </div>
                    </div>

                    <div className="my-2 border-t border-ink/8" />

                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Not logged in: Sign in link ── */
            <Link
              href="/login"
              className="hidden lg:inline-block text-sm font-semibold text-ink/75 hover:text-ink px-2.5 py-1.5 rounded-lg hover:bg-paper transition-colors"
            >
              Sign in
            </Link>
          )}

          <button
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="menu-toggle"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {open && (
        <nav className="nav-mobile" onClick={() => setOpen(false)}>
          {nav.map((n) => (
            <ScrollLink key={n.id} id={n.id} className="py-1 font-medium">
              {n.label}
            </ScrollLink>
          ))}

          <div className="pt-3 mt-1 border-t border-ink/10">
            {user ? (
              <div className="space-y-2">
                {/* Mobile user info */}
                <div className="flex items-center gap-3 px-1 py-2">
                  <span className="w-9 h-9 rounded-full bg-ink text-white text-sm font-bold flex items-center justify-center select-none">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-ink truncate">{displayName}</p>
                    <p className="text-xs text-ink/60 truncate">{displayEmail}</p>
                  </div>
                </div>
                <Link href="/dashboard" className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-ink text-white text-xs font-bold w-full">
                  Dashboard
                  <span className="w-2 h-2 rounded-full bg-brand ml-1" />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold w-full"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-block py-1.5 px-3 rounded-lg bg-paper text-ink text-xs font-bold border border-ink/10"
              >
                Sign in →
              </Link>
            )}
          </div>
        </nav>
      )}

      <div className="scroll-progress-bar" style={{ width: `${progress}%` }} />
    </header>
  );
}
