import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { z } from "zod";

import {
  AiError,
  createGateway,
  errorResponse,
  readBody,
  toAiError,
} from "@/lib/ai/gateway.server";

import { COACH_INSTRUCTIONS } from "@/lib/ai/prompts.server";

const bodySchema = z.object({
  messages: z
    .array(
      z
        .object({
          id: z.string(),
          role: z.enum(["user", "assistant", "system"]),
          parts: z.array(z.any()),
        })
        .passthrough(),
    )
    .min(1)
    .max(200),
});

/** POST /api/coach — streaming IQ Coach chat. */
export const Route = createFileRoute("/api/coach")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await readBody(request, bodySchema);
          const messages = body.messages.slice(-40) as unknown as UIMessage[];

          const gateway = createGateway();

          const result = streamText({
            model: gateway.model,
            instructions: COACH_INSTRUCTIONS,
            messages: await convertToModelMessages(messages),
            abortSignal: request.signal,
          });

          return result.toUIMessageStreamResponse({
            originalMessages: messages,
            onError: (error) => toAiError(error).message,
          });
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            return new Response(null, { status: 499 });
          }

          if (error instanceof AiError) {
            return errorResponse(error);
          }

          return errorResponse(error);
        }
      },
    },
  },
});
