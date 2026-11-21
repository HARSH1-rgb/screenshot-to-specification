import { cn } from "@/lib/utils";

/** TalentLens mark: a lens with a focus arc and a highlight glint. */
export function LensMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" className="fill-ink" />
      <circle cx="15" cy="15" r="8" fill="none" strokeWidth="2.4" className="stroke-ink-foreground" />
      <path d="M10.5 15a4.5 4.5 0 0 1 4.5-4.5" fill="none" strokeWidth="2" strokeLinecap="round" className="stroke-highlight" />
      <path d="M21 21l4.5 4.5" strokeWidth="2.6" strokeLinecap="round" className="stroke-ink-foreground" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LensMark />
      <span className="font-display text-lg font-semibold tracking-tight">
        Talent<span className="text-primary">Lens</span>
      </span>
    </span>
  );
}
