import type { z } from "zod";

import {
  evaluationSchema,
  nextQuestionSchema,
  reportSchema,
  resumeResultSchema,
  type Evaluation,
  type InterviewConfig,
} from "@/lib/interview/schemas";

/** Browser client for the AI endpoints. Every response is validated before the UI renders it. */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function postJson<S extends z.ZodTypeAny>(path: string, body: unknown, schema: S): Promise<z.infer<S>> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Couldn't reach TalentLens. Check your internet connection and try again.", 0);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new ApiError(
      res.ok ? "The AI returned an unexpected response. Please try again." : "The AI service isn't available right now.",
      res.status,
    );
  }

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : "Something went wrong. Please try again.";
    throw new ApiError(message, res.status);
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new ApiError("The AI returned an unexpected response. Please try again.", 502);
  return parsed.data;
}

export const api = {
  nextQuestion: (config: InterviewConfig, history: { question: string; answer: string }[]) =>
    postJson("/api/interview", { config, history }, nextQuestionSchema),
  evaluate: (config: InterviewConfig, question: string, answer: string) =>
    postJson("/api/evaluate", { config, question, answer }, evaluationSchema),
  report: (config: InterviewConfig, items: { question: string; answer: string; evaluation: Evaluation }[]) =>
    postJson("/api/report", { config, items }, reportSchema),
  resume: (resumeText: string, jobDescription: string) =>
    postJson("/api/resume", { resumeText, jobDescription }, resumeResultSchema),
};

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
