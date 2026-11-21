import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { APICallError, NoObjectGeneratedError, Output, streamText } from "ai";
import type { z } from "zod";

import { createLovableAiGatewayRunIdFetch } from "./run-id.server";

export { getLovableAiGatewayRunId, withLovableAiGatewayRunIdHeader } from "./run-id.server";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
/** Gemini, as requested in the TalentLens brief. */
export const AI_MODEL = "google/gemini-3.8-flash";

/** An error that is safe to show to the person using the app. */
export class AiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Build a per-request provider. Throws a friendly 503 when the AI key is not configured. */
export function createGateway(initialRunId?: string) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    throw new AiError(
      "AI isn't configured on the server yet. You can still browse TalentLens — AI features will work once it's set up.",
      503,
    );
  }
  const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);
  const provider = createOpenAICompatible({
    name: "lovable",
    baseURL: GATEWAY_URL,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  return {
    model: provider(AI_MODEL),
    getRunId: runIdFetch.getRunId,
    waitForRunId: runIdFetch.waitForRunId,
  };
}

function extractJson(text: string | undefined): unknown {
  if (!text) return undefined;
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return undefined;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return undefined;
  }
}

/** Map any upstream failure to a friendly, status-preserving AiError. */
export function toAiError(error: unknown): AiError {
  if (error instanceof AiError) return error;
  const status = APICallError.isInstance(error) ? error.statusCode : undefined;
  if (status === 402)
    return new AiError("AI credits have run out for this workspace. Add credits to keep practising.", 402);
  if (status === 429)
    return new AiError("Lots of people are practising right now. Please wait a moment and try again.", 429);
  if (status === 403)
    return new AiError("The AI service declined this request. Please try a different answer or question.", 403);
  if (status === 401)
    return new AiError("AI isn't configured correctly on the server yet.", 503);
  console.error("[ai] request failed", error);
  return new AiError("The AI service is having trouble right now. Please try again.", 502);
}

/**
 * Stream a structured JSON answer from the model and validate it.
 * Streaming keeps long generations alive; the caller only gets the final, validated object.
 */
export async function generateJson<S extends z.ZodTypeAny>(opts: {
  instructions: string;
  prompt: string;
  schema: S;
}): Promise<z.infer<S>> {
  const gateway = createGateway();
  let streamError: unknown;
  const result = streamText({
    model: gateway.model,
    instructions: opts.instructions,
    prompt: opts.prompt,
    output: Output.object({ schema: opts.schema }),
    onError: ({ error }) => {
      streamError = error;
    },
  });

  try {
    return (await result.output) as z.infer<S>;
  } catch (error) {
    if (streamError) throw toAiError(streamError);
    if (NoObjectGeneratedError.isInstance(error)) {
      const parsed = opts.schema.safeParse(extractJson(error.text));
      if (parsed.success) return parsed.data;
      console.error("[ai] malformed JSON from model", error.text?.slice(0, 500));
      throw new AiError("The AI returned an unexpected response. Please try again.", 502);
    }
    throw toAiError(error);
  }
}

/** JSON error response used by every AI endpoint. */
export function errorResponse(error: unknown): Response {
  const e = toAiError(error);
  return Response.json({ error: e.message }, { status: e.status });
}

/** Parse and validate a JSON request body. */
export async function readBody<S extends z.ZodTypeAny>(request: Request, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new AiError("The request body must be valid JSON.", 400);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new AiError(first?.message ?? "Some of the details sent were invalid.", 400);
  }
  return parsed.data;
}
