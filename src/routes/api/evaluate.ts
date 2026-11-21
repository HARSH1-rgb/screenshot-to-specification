import { createFileRoute } from "@tanstack/react-router";

import { errorResponse, generateJson, readBody } from "@/lib/ai/gateway.server";
import { EVALUATOR_INSTRUCTIONS, evaluatePrompt } from "@/lib/ai/prompts.server";
import { aiEvaluationSchema, evaluateRequestSchema, type Evaluation } from "@/lib/interview/schemas";
import { normalizeScores, overallFromScores } from "@/lib/interview/scoring";

/** POST /api/evaluate — scores and feedback for one answer. */
export const Route = createFileRoute("/api/evaluate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { config, question, answer } = await readBody(request, evaluateRequestSchema);
          const ai = await generateJson({
            instructions: EVALUATOR_INSTRUCTIONS,
            prompt: evaluatePrompt(config, question, answer),
            schema: aiEvaluationSchema,
          });
          const scores = normalizeScores(ai.scores);
          const evaluation: Evaluation = {
            scores,
            overall: overallFromScores(scores),
            strengths: ai.strengths.slice(0, 3),
            weaknesses: ai.weaknesses.slice(0, 3),
            feedback: ai.feedback,
            idealAnswer: ai.idealAnswer,
          };
          return Response.json(evaluation);
        } catch (error) {
          return errorResponse(error);
        }
      },
    },
  },
});
