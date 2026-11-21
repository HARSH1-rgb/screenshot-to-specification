import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { APICallError, NoObjectGeneratedError, Output, streamText } from "ai";
import type { z } from "zod";

const OPENAI_BASE_URL = "https://api.openai.com/v1";

// Change the model here if you want to use another OpenAI model.
export const AI_MODEL = "gpt-4o-mini";

export class AiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Create an OpenAI provider using the server-side API key. */
export function createGateway() {
  const apiKey = process.env["OPENAI_API_KEY"];

  if (!apiKey) {
    throw new AiError(
      "AI isn't configured on the server yet. Add OPENAI_API_KEY in Vercel Environment Variables.",
      503,
    );
  }

  const provider = createOpenAICompatible({
    name: "openai",
    baseURL: OPENAI_BASE_URL,
    apiKey,
  });

  return {
    model: provider(AI_MODEL),
  };
}

function extractJson(text: string | undefined): unknown {
  if (!text) return undefined;

  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end <= start) return undefined;

  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return undefined;
  }
}

/** Convert API errors into user-friendly messages. */
/*export function toAiError(error: unknown): AiError {
  if (error instanceof AiError) return error;
  const status = APICallError.isInstance(error) ? error.statusCode : undefined;

  if (status === 429) {
    return new AiError("OpenAI rate limit reached. Please wait and try again.", 429);
  }

  if (status === 401 || status === 403) {
    return new AiError(
      "OpenAI API authentication failed. Check your OPENAI_API_KEY in Vercel.",
      503,
    );
  }

  if (status === 402) {
    return new AiError("Your OpenAI API account may have insufficient credits or billing.", 402);
  }

  console.error("[ai] request failed", error);

  return new AiError("The AI service is having trouble right now. Please try again.", 502);
}
*/

export function toAiError(error: unknown): AiError {
  // TEMPORARY DEBUGGING: print the actual upstream error in Vercel logs
  console.error("[OpenAI API ERROR - FULL DETAILS]", error);

  if (error instanceof AiError) return error;

  const status = APICallError.isInstance(error)
    ? error.statusCode
    : undefined;

  if (status === 429) {
    return new AiError(
      "OpenAI rate limit reached. Check your API limits and billing.",
      429,
    );
  }

  if (status === 401 || status === 403) {
    return new AiError(
      "OpenAI authentication failed. Check OPENAI_API_KEY.",
      503,
    );
  }

  if (status === 402) {
    return new AiError(
      "OpenAI API billing or credits issue. Check your API billing.",
      402,
    );
  }

  return new AiError(
    "The AI service is having trouble right now. Check Vercel logs for the actual error.",
    502,
  );
}

/** Generate a structured JSON answer and validate it against the schema. */
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
export async function readBody<S extends z.ZodTypeAny>(
  request: Request,
  schema: S,
): Promise<z.infer<S>> {
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
