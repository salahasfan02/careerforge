import type { z } from "zod";
import { getProvider, type CompleteOptions } from "./provider";
import { logGeneration } from "../server/collections/aiGenerations";
import type { AiGenerationLogEntry } from "../server/types";

export class AiUnavailableError extends Error {
  constructor() {
    super("Local AI (Ollama) is not reachable. Start Ollama or check Settings.");
    this.name = "AiUnavailableError";
  }
}

function stripCodeFence(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : raw).trim();
}

/**
 * Calls the local LLM and validates its output against a zod schema, retrying
 * once with a stricter reminder if the first response doesn't parse. Every
 * call is logged (prompt + raw response) via aiGenerations for traceability —
 * this product's core promise is that AI claims can be audited, not trusted blindly.
 */
export async function generateStructured<S extends z.ZodTypeAny>(
  kind: AiGenerationLogEntry["kind"],
  system: string,
  user: string,
  schema: S,
  opts?: CompleteOptions & { refTable?: string; refId?: number }
): Promise<z.infer<S>> {
  const provider = await getProvider();
  if (!provider) throw new AiUnavailableError();

  let lastRaw = "";
  let retryCount = 0;

  for (let attempt = 0; attempt < 2; attempt++) {
    retryCount = attempt;
    const started = Date.now();
    const prompt = attempt === 0 ? user : `${user}\n\nReminder: respond with ONLY valid JSON matching the required shape, no commentary, no markdown code fences.`;

    const raw = await provider.complete(system, prompt, { ...opts, json: true });
    lastRaw = raw;
    const durationMs = Date.now() - started;

    try {
      const parsed = schema.parse(JSON.parse(stripCodeFence(raw)));
      await logGeneration({
        kind,
        refTable: opts?.refTable ?? null,
        refId: opts?.refId ?? null,
        model: provider.name,
        prompt,
        rawResponse: raw,
        parsedOk: true,
        retryCount,
        durationMs,
      });
      return parsed;
    } catch {
      await logGeneration({
        kind,
        refTable: opts?.refTable ?? null,
        refId: opts?.refId ?? null,
        model: provider.name,
        prompt,
        rawResponse: raw,
        parsedOk: false,
        retryCount,
        durationMs,
      });
    }
  }

  throw new Error(
    `The local AI model returned a response that couldn't be parsed after retrying. Last response: ${lastRaw.slice(0, 500)}`
  );
}
