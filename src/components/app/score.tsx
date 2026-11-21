import { bandFor, type ScoreBand } from "@/lib/interview/scoring";
import { cn } from "@/lib/utils";

const bandText: Record<ScoreBand, string> = {
  high: "text-success",
  mid: "text-warning",
  low: "text-destructive",
};
const bandStroke: Record<ScoreBand, string> = {
  high: "stroke-success",
  mid: "stroke-warning",
  low: "stroke-destructive",
};
const bandFill: Record<ScoreBand, string> = {
  high: "bg-success",
  mid: "bg-warning",
  low: "bg-destructive",
};
const bandSoft: Record<ScoreBand, string> = {
  high: "bg-success-soft text-success",
  mid: "bg-warning-soft text-warning",
  low: "bg-destructive-soft text-destructive",
};

/** Circular score out of 100. */
export function ScoreRing({ score, size = 140, label = "Overall" }: { score: number; size?: number; label?: string }) {
  const band = bandFor(score);
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="-rotate-90" width={size} height={size} role="img" aria-label={`${label} score ${score} out of 100`}>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" className="stroke-muted" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(100, Math.max(0, score)) / 100)}
          className={cn(bandStroke[band], "transition-[stroke-dashoffset] duration-700")}
        />
      </svg>
      <div className="absolute text-center">
        <div className={cn("tabular text-4xl font-semibold", bandText[band])}>{score}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

/** Horizontal bar for a 0–10 dimension score. */
export function ScoreBar({ label, value }: { label: string; value: number }) {
  const band = bandFor(value * 10);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular text-muted-foreground">{value.toFixed(1)}/10</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-[width] duration-700", bandFill[band])} style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  );
}

export function ScorePill({ score, className }: { score: number; className?: string }) {
  return (
    <span className={cn("tabular inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold", bandSoft[bandFor(score)], className)}>
      {score}
    </span>
  );
}
