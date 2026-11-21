import { createFileRoute } from "@tanstack/react-router";

import { errorResponse, generateJson, readBody } from "@/lib/ai/gateway.server";
import { INTERVIEWER_INSTRUCTIONS, interviewPrompt } from "@/lib/ai/prompts.server";
import { interviewRequestSchema, nextQuestionSchema } from "@/lib/interview/schemas";

/** POST /api/interview — the next adaptive question for the session. */
export const Route = createFileRoute("/api/interview")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { config, history } = await readBody(request, interviewRequestSchema);
          const next = await generateJson({
            instructions: INTERVIEWER_INSTRUCTIONS,
            prompt: interviewPrompt(config, history),
            schema: nextQuestionSchema,
          });
          return Response.json({
            ...next,
            question: next.question.trim(),
            direction: history.length === 0 ? "opening" : next.direction,
          });
        } catch (error) {
          return errorResponse(error);
        }
      },
    },
  },
});
