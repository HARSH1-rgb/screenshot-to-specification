import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { APICallError, NoObjectGeneratedError, Output, streamText } from "ai";
import type { z } from "zod";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

// Groq model
export const AI_MODEL = "openai/gpt-oss-20b";

export class AiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Create the Groq provider using a server-side API key. */
export function createGateway() {
  const apiKey = process.env["GROQ_API_KEY"];

  if (!apiKey) {
    throw new AiError(
      "AI isn't configured. Add GROQ_API_KEY in Vercel Environment Variables.",
      503,
    );
  }

  const provider = createOpenAICompatible({
    name: "groq",
    baseURL: GROQ_BASE_URL,
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

/** Convert API errors into readable messages. */
export function toAiError(error: unknown): AiError {
  console.error("[Groq API ERROR]", error);

  if (error instanceof AiError) return error;

  const status = APICallError.isInstance(error) ? error.statusCode : undefined;

  if (status === 429) {
    return new AiError("Groq rate limit reached. Please wait and try again.", 429);
  }

  if (status === 401 || status === 403) {
    return new AiError("Groq API authentication failed. Check GROQ_API_KEY.", 503);
  }

  if (status === 402) {
    return new AiError("Groq API billing or account limit reached.", 402);
  }

  return new AiError("Groq is having trouble processing the request. Please try again.", 502);
}

/** Generate structured JSON and validate it against the supplied schema. */
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

      console.error("[Groq] Invalid JSON response", error.text?.slice(0, 500));

      throw new AiError("The AI returned an unexpected response. Please try again.", 502);
    }

    throw toAiError(error);
  }
}

/** Standard JSON error response for AI endpoints. */
export function errorResponse(error: unknown): Response {
  const e = toAiError(error);
  return Response.json({ error: e.message }, { status: e.status });
}

/** Parse and validate JSON request body. */
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
