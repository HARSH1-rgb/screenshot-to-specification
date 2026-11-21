import type { UIMessage } from "ai";
import { z } from "zod";

import { evaluationSchema, interviewConfigSchema, reportSchema } from "@/lib/interview/schemas";

/** Everything TalentLens remembers lives in this browser's localStorage. Nothing is sent to a database. */

const REPORTS_KEY = "talentlens.reports.v1";
const COACH_KEY = "talentlens.coach.v1";
const MAX_REPORTS = 30;

export const savedReportSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  config: interviewConfigSchema,
  report: reportSchema,
  items: z.array(
    z.object({
      question: z.string(),
      topic: z.string(),
      answer: z.string(),
      durationSec: z.number(),
      evaluation: evaluationSchema,
    }),
  ),
});
export type SavedReport = z.infer<typeof savedReportSchema>;

function read(key: string): unknown {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or disabled — the session still works, it just won't be remembered.
  }
}

export function listReports(): SavedReport[] {
  const raw = read(REPORTS_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((r) => {
    const parsed = savedReportSchema.safeParse(r);
    return parsed.success ? [parsed.data] : [];
  });
}

export function getReport(id: string): SavedReport | undefined {
  return listReports().find((r) => r.id === id);
}

export function saveReport(report: SavedReport) {
  const rest = listReports().filter((r) => r.id !== report.id);
  write(REPORTS_KEY, [report, ...rest].slice(0, MAX_REPORTS));
}

export function deleteReport(id: string) {
  write(
    REPORTS_KEY,
    listReports().filter((r) => r.id !== id),
  );
}

export function loadCoachMessages(): UIMessage[] {
  const raw = read(COACH_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (m): m is UIMessage =>
      !!m && typeof m === "object" && typeof m.id === "string" && typeof m.role === "string" && Array.isArray(m.parts),
  );
}

export function saveCoachMessages(messages: UIMessage[]) {
  write(COACH_KEY, messages.slice(-100));
}

export function clearCoachMessages() {
  if (typeof window !== "undefined") window.localStorage.removeItem(COACH_KEY);
}

export function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
