import { CheckCircle2, CircleAlert } from "lucide-react";

import { ScoreBar, ScorePill } from "@/components/app/score";
import { SCORE_KEYS, SCORE_LABELS, type Evaluation } from "@/lib/interview/schemas";

export function EvaluationDetails({ evaluation }: { evaluation: Evaluation }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {SCORE_KEYS.map((k) => (
          <ScoreBar key={k} label={SCORE_LABELS[k]} value={evaluation.scores[k]} />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <PointList title="What worked" items={evaluation.strengths} tone="good" empty="Nothing stood out yet — see the tips below." />
        <PointList title="To improve" items={evaluation.weaknesses} tone="bad" empty="No major issues." />
      </div>
      <div className="rounded-lg bg-secondary p-4 text-sm">
        <p className="mb-1 font-semibold">Coach's feedback</p>
        <p className="text-muted-foreground">{evaluation.feedback}</p>
      </div>
      <details className="group rounded-lg border border-border p-4 text-sm">
        <summary className="cursor-pointer font-semibold marker:text-primary">What a strong answer includes</summary>
        <p className="mt-3 whitespace-pre-line text-muted-foreground">{evaluation.idealAnswer}</p>
      </details>
    </div>
  );
}

export function EvaluationHeader({ evaluation }: { evaluation: Evaluation }) {
  return (
    <div className="flex items-center gap-3">
      <ScorePill score={evaluation.overall} className="text-base" />
      <span className="text-sm text-muted-foreground">out of 100 for this answer</span>
    </div>
  );
}

export function PointList({ title, items, tone, empty }: { title: string; items: string[]; tone: "good" | "bad"; empty: string }) {
  const Icon = tone === "good" ? CheckCircle2 : CircleAlert;
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{title}</p>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((s, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <Icon className={tone === "good" ? "mt-0.5 size-4 shrink-0 text-success" : "mt-0.5 size-4 shrink-0 text-warning"} aria-hidden="true" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}
