import { createFileRoute } from "@tanstack/react-router";

import { errorResponse, generateJson, readBody } from "@/lib/ai/gateway.server";
import { REPORT_INSTRUCTIONS, describeConfig } from "@/lib/ai/prompts.server";
import { aiReportSchema, reportRequestSchema, type Report } from "@/lib/interview/schemas";
import { averageCategories, readinessFor, sessionScore } from "@/lib/interview/scoring";

/** POST /api/report — final performance report and learning roadmap. Scores are computed here, not by the model. */
export const Route = createFileRoute("/api/report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { config, items } = await readBody(request, reportRequestSchema);
          const evaluations = items.map((i) => i.evaluation);
          const overallScore = sessionScore(evaluations);
          const categoryScores = averageCategories(evaluations);

          const transcript = items
            .map(
              (it, i) =>
                `Q${i + 1}: ${it.question}\nAnswer: ${it.answer}\nScore: ${it.evaluation.overall}/100\nStrengths: ${it.evaluation.strengths.join("; ") || "none"}\nWeaknesses: ${it.evaluation.weaknesses.join("; ") || "none"}`,
            )
            .join("\n\n");

          const ai = await generateJson({
            instructions: REPORT_INSTRUCTIONS,
            prompt: `${describeConfig(config)}\nQuestions answered: ${items.length}\nOverall score: ${overallScore}/100\nCategory averages (0-10): ${JSON.stringify(categoryScores)}\n\n${transcript}\n\nWrite the report.`,
            schema: aiReportSchema,
          });

          const report: Report = {
            ...ai,
            strengths: ai.strengths.slice(0, 4),
            weaknesses: ai.weaknesses.slice(0, 4),
            roadmap: ai.roadmap.slice(0, 6).map((s) => ({ ...s, resources: s.resources.slice(0, 4) })),
            overallScore,
            categoryScores,
            readiness: readinessFor(overallScore),
          };
          return Response.json(report);
        } catch (error) {
          return errorResponse(error);
        }
      },
    },
  },
});
