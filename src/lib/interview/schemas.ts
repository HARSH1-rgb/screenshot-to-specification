import { z } from "zod";

/** Shared contracts between the browser and the AI endpoints. Both sides validate with these. */

export const LEVELS = ["Student / Intern", "Fresher (0-1 yrs)", "Junior (1-3 yrs)", "Mid-level (3-5 yrs)", "Senior (5+ yrs)"] as const;
export const INTERVIEW_TYPES = ["Technical", "Behavioral", "HR", "Mixed"] as const;
export const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
export const QUESTION_COUNTS = [3, 5, 7, 10] as const;
export const SCORE_KEYS = ["correctness", "relevance", "clarity", "depth", "communication"] as const;
export type ScoreKey = (typeof SCORE_KEYS)[number];

export const SCORE_LABELS: Record<ScoreKey, string> = {
  correctness: "Correctness",
  relevance: "Relevance",
  clarity: "Clarity",
  depth: "Depth",
  communication: "Communication",
};

export const interviewConfigSchema = z.object({
  role: z.string().trim().min(2, "Enter a job role").max(80),
  level: z.enum(LEVELS),
  type: z.enum(INTERVIEW_TYPES),
  difficulty: z.enum(DIFFICULTIES),
  questionCount: z.number().int().min(1).max(10),
});
export type InterviewConfig = z.infer<typeof interviewConfigSchema>;

export const MAX_ANSWER_CHARS = 4000;

export const historyTurnSchema = z.object({
  question: z.string().min(1).max(1200),
  answer: z.string().max(MAX_ANSWER_CHARS),
});

export const interviewRequestSchema = z.object({
  config: interviewConfigSchema,
  history: z.array(historyTurnSchema).max(10),
});

export const DIRECTIONS = ["opening", "deeper", "clarify", "new_topic"] as const;
export const nextQuestionSchema = z.object({
  question: z.string().min(5),
  topic: z.string(),
  direction: z.enum(DIRECTIONS),
});
export type NextQuestion = z.infer<typeof nextQuestionSchema>;

const score = z.number().min(0).max(10);
export const scoresSchema = z.object({
  correctness: score,
  relevance: score,
  clarity: score,
  depth: score,
  communication: score,
});
export type Scores = z.infer<typeof scoresSchema>;

export const evaluateRequestSchema = z.object({
  config: interviewConfigSchema,
  question: z.string().trim().min(1).max(1200),
  answer: z.string().trim().min(1, "Write an answer before submitting").max(MAX_ANSWER_CHARS),
});

/** What the model returns for one answer. */
export const aiEvaluationSchema = z.object({
  scores: scoresSchema,
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  feedback: z.string(),
  idealAnswer: z.string(),
});

/** What the endpoint returns: the model output plus the score computed in code. */
export const evaluationSchema = aiEvaluationSchema.extend({
  overall: z.number().min(0).max(100),
});
export type Evaluation = z.infer<typeof evaluationSchema>;

export const reportRequestSchema = z.object({
  config: interviewConfigSchema,
  items: z
    .array(
      z.object({
        question: z.string().min(1).max(1200),
        answer: z.string().max(MAX_ANSWER_CHARS),
        evaluation: evaluationSchema,
      }),
    )
    .min(1, "Answer at least one question first")
    .max(10),
});

export const aiReportSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  feedback: z.string(),
  roadmap: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      timeframe: z.string(),
      resources: z.array(z.string()),
    }),
  ),
});

export const READINESS = ["Interview ready", "Almost there", "Needs practice"] as const;
export const reportSchema = aiReportSchema.extend({
  overallScore: z.number().min(0).max(100),
  categoryScores: scoresSchema,
  readiness: z.enum(READINESS),
});
export type Report = z.infer<typeof reportSchema>;

export const resumeRequestSchema = z.object({
  resumeText: z.string().trim().min(50, "Paste at least a few lines of your resume").max(15000),
  jobDescription: z.string().trim().min(50, "Paste at least a few lines of the job description").max(10000),
});

export const resumeResultSchema = z.object({
  matchScore: z.number().min(0).max(100),
  summary: z.string(),
  matchingSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  improvements: z.array(z.string()),
});
export type ResumeResult = z.infer<typeof resumeResultSchema>;
