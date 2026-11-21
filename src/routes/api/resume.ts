import { createFileRoute } from "@tanstack/react-router";

import { errorResponse, generateJson, readBody } from "@/lib/ai/gateway.server";
import { RESUME_INSTRUCTIONS } from "@/lib/ai/prompts.server";
import { resumeRequestSchema, resumeResultSchema } from "@/lib/interview/schemas";

/** POST /api/resume — compare resume text with a job description. Nothing is stored. */
export const Route = createFileRoute("/api/resume")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { resumeText, jobDescription } = await readBody(request, resumeRequestSchema);
          const result = await generateJson({
            instructions: RESUME_INSTRUCTIONS,
            prompt: `Job description:\n"""\n${jobDescription}\n"""\n\nResume:\n"""\n${resumeText}\n"""\n\nCompare them.`,
            schema: resumeResultSchema,
          });
          return Response.json({
            ...result,
            matchScore: Math.round(Math.min(100, Math.max(0, result.matchScore))),
            matchingSkills: result.matchingSkills.slice(0, 10),
            missingSkills: result.missingSkills.slice(0, 10),
            improvements: result.improvements.slice(0, 6),
          });
        } catch (error) {
          return errorResponse(error);
        }
      },
    },
  },
});
