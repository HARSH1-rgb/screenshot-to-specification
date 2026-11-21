import { describe, expect, it } from "vitest";

import { evaluateRequestSchema } from "@/lib/interview/schemas";
import { averageCategories, overallFromScores, readinessFor, sessionScore } from "@/lib/interview/scoring";

const config = { role: "Frontend Developer", level: "Fresher (0-1 yrs)", type: "Technical", difficulty: "Medium", questionCount: 5 } as const;

describe("interview scoring", () => {
  it("overall answer score is the average of the five skills × 10", () => {
    expect(overallFromScores({ correctness: 8, relevance: 9, clarity: 7, depth: 6, communication: 10 })).toBe(80);
  });

  it("clamps out-of-range skill scores to 0–10", () => {
    expect(overallFromScores({ correctness: 15, relevance: 10, clarity: 10, depth: 10, communication: -3 })).toBe(80);
  });

  it("session score averages each answer's overall score", () => {
    expect(sessionScore([{ overall: 90 }, { overall: 60 }, { overall: 75 }])).toBe(75);
  });

  it("averages each skill across answers", () => {
    const s = (n: number) => ({ correctness: n, relevance: n, clarity: n, depth: n, communication: n });
    expect(averageCategories([{ scores: s(6) }, { scores: s(9) }]).depth).toBe(7.5);
  });

  it("maps scores to readiness bands at 75 and 55", () => {
    expect(readinessFor(75)).toBe("Interview ready");
    expect(readinessFor(74)).toBe("Almost there");
    expect(readinessFor(55)).toBe("Almost there");
    expect(readinessFor(54)).toBe("Needs practice");
  });

  it("rejects an empty answer", () => {
    expect(evaluateRequestSchema.safeParse({ config, question: "Q?", answer: "   " }).success).toBe(false);
  });
});
