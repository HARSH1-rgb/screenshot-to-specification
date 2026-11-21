import { READINESS, SCORE_KEYS, type Evaluation, type Scores } from "./schemas";

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Clamp each 0–10 dimension and round to one decimal. */
export function normalizeScores(scores: Scores): Scores {
  const out = {} as Scores;
  for (const key of SCORE_KEYS) out[key] = round1(clamp(Number(scores[key]) || 0, 0, 10));
  return out;
}

/** Overall answer score out of 100: the average of the five dimensions × 10. */
export function overallFromScores(scores: Scores): number {
  const n = normalizeScores(scores);
  const sum = SCORE_KEYS.reduce((acc, key) => acc + n[key], 0);
  return Math.round((sum / SCORE_KEYS.length) * 10);
}

/** Average each dimension across all answered questions. */
export function averageCategories(evaluations: Pick<Evaluation, "scores">[]): Scores {
  const out = {} as Scores;
  for (const key of SCORE_KEYS) {
    const total = evaluations.reduce((acc, e) => acc + clamp(e.scores[key], 0, 10), 0);
    out[key] = evaluations.length ? round1(total / evaluations.length) : 0;
  }
  return out;
}

/** Session score out of 100: the average of each answer's overall score. */
export function sessionScore(evaluations: Pick<Evaluation, "overall">[]): number {
  if (!evaluations.length) return 0;
  return Math.round(evaluations.reduce((acc, e) => acc + e.overall, 0) / evaluations.length);
}

export function readinessFor(score: number): (typeof READINESS)[number] {
  if (score >= 75) return "Interview ready";
  if (score >= 55) return "Almost there";
  return "Needs practice";
}

export type ScoreBand = "high" | "mid" | "low";
/** Colour band for a 0–100 score. */
export function bandFor(score100: number): ScoreBand {
  if (score100 >= 75) return "high";
  if (score100 >= 55) return "mid";
  return "low";
}
