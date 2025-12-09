import { z } from "zod";
import pRetry, { AbortError } from "p-retry";
import { ChatOpenAI } from "@langchain/openai";
import type { ChatOpenAICallOptions } from "@langchain/openai";
import type { BaseMessage } from "@langchain/core/messages";

export type LLMRuntimeOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  signal?: AbortSignal;
  retries?: number;
  timeoutMs?: number;
  schemaName?: string;
  strict?: boolean;
  callOptions?: Partial<ChatOpenAICallOptions>;
};

const DEFAULTS = {
  model: "gpt-4.1-mini",
  temperature: 0,
  maxTokens: 10000,
  retries: 3,
  timeoutMs: 60_000,
  schemaName: "structured_output",
  strict: true,
} as const;

export function createLLM(opts: LLMRuntimeOptions = {}) {
  const apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new ChatOpenAI({
    apiKey,
    model: opts.model ?? DEFAULTS.model,
    temperature: opts.temperature ?? DEFAULTS.temperature,
    maxTokens: opts.maxTokens ?? DEFAULTS.maxTokens,
    timeout: opts.timeoutMs ?? DEFAULTS.timeoutMs,
  });
}

const DEFAULT_SYSTEM_PROMPT = `
You are an information extraction assistant.
Return ONLY a single JSON object that EXACTLY matches the provided JSON schema.
No code fences. No explanations. Never output additional keys.
Trim strings. Use defaults/nulls per the schema when information is missing.
`.trim();

function ensureSystemMessage(
  msgs: Array<
    | BaseMessage
    | {
        role: "system" | "user" | "assistant" | "tool";
        content: string;
      }
  >,
  system: string,
) {
  const hasSystem = msgs.some(
    (m: any) => m?.role === "system" || m?._getType?.() === "system",
  );
  return hasSystem
    ? (msgs as any)
    : [{ role: "system" as const, content: system }, ...(msgs as any)];
}

export async function structuredExtract<TSchema extends z.ZodTypeAny>(
  params: {
    schema: TSchema;
    input:
      | string
      | Array<
          | BaseMessage
          | {
              role: "system" | "user" | "assistant" | "tool";
              content: string;
            }
        >;
    systemPrompt?: string;
  } & LLMRuntimeOptions,
): Promise<z.infer<TSchema>> {
  const {
    schema,
    input,
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
    schemaName = DEFAULTS.schemaName,
    strict = DEFAULTS.strict,
    retries = DEFAULTS.retries,
    ...llmOpts
  } = params;

  const llm = createLLM(llmOpts);

  const structuredLLM = llm.withStructuredOutput(schema, {
    name: schemaName,
    strict,
  });

  const messages =
    typeof input === "string"
      ? [
          { role: "system" as const, content: systemPrompt },
          { role: "user" as const, content: input },
        ]
      : ensureSystemMessage(input, systemPrompt);

  return pRetry(
    async () => {
      try {
        const out = await structuredLLM.invoke(messages, {
          signal: llmOpts.signal,
          ...(llmOpts.callOptions ?? {}),
        });
        return out as z.infer<TSchema>;
      } catch (err: any) {
        const msg = String(err?.message ?? err);
        const isRateLimit =
          err?.status === 429 || /rate limit|too many requests/i.test(msg);
        const isTimeout = /timeout/i.test(msg) || err?.name === "TimeoutError";
        const isServer =
          (err?.status && err.status >= 500) ||
          /overloaded|unavailable/i.test(msg);
        const isJSON = /invalid json|parse/i.test(msg);
        if (isRateLimit || isTimeout || isServer) throw err;
        if (!strict && isJSON) throw new AbortError(err);
        throw new AbortError(err);
      }
    },
    { retries, minTimeout: 500, maxTimeout: 5000, factor: 2, randomize: true },
  );
}
