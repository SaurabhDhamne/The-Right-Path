"use client";
import { smoothScrollTo } from "@/lib/scroll";

export default function ScrollLink({ id, className = "", children }: { id: string; className?: string; children: React.ReactNode }) {
  return (
    <a href={`#${id}`} className={className} onClick={(e) => { e.preventDefault(); smoothScrollTo(id); }}>
      {children}
    </a>
  );
}
