import { site } from "@/lib/site";

// PLACEHOLDER logo: swap for an <Image> when the real logo is ready.
export default function Logo() {
  return (
    <span className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand font-display text-xl font-bold text-ink">L</span>
      <span className="leading-tight">
        <span className="block font-display text-lg font-bold">{site.name}</span>
        <span className="block text-xs text-mist">{site.tagline}</span>
      </span>
    </span>
  );
}
