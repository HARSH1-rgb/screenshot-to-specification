import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
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
          id: z.string().optional(),
          role: z.enum(["user", "assistant", "system"]),
          parts: z.array(z.any()).optional(),
        })
        .passthrough(),
    )
    .min(1)
    .max(200),
});

/** POST /api/coach — IQ Coach chat */
export const Route = createFileRoute("/api/coach")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await readBody(request, bodySchema);

          // Clean chat history and remove unsupported AI metadata.
          const messages = body.messages
            .slice(-40)
            .filter(
              (message) =>
                message.role === "user" || message.role === "assistant",
            )
            .map((message) => ({
              role: message.role as "user" | "assistant",
              content: (message.parts ?? [])
                .filter(
                  (part) =>
                    part?.type === "text" &&
                    typeof part.text === "string",
                )
                .map((part) => part.text)
                .join("\n")
                .trim(),
            }))
            .filter((message) => message.content.length > 0);

          if (messages.length === 0) {
            return Response.json(
              { error: "Please enter a message to start chatting." },
              { status: 400 },
            );
          }

          const gateway = createGateway();

          const result = streamText({
            model: gateway.model,
            system: COACH_INSTRUCTIONS,
            messages,
            abortSignal: request.signal,
          });

          return result.toUIMessageStreamResponse({
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
