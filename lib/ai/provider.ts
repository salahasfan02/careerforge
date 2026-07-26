import { getSettings } from "../server/collections/settings";

export interface CompleteOptions {
  /** Return strict JSON (Ollama's `format: "json"` constrained decoding). */
  json?: boolean;
  /** Defaults to 0 for classification/extraction calls — deterministic, not creative. */
  temperature?: number;
  /** Base64-encoded images (no data: prefix) for vision-model calls. */
  images?: string[];
  model?: string;
  /** Max output tokens. Ollama's own default is too small for longer structured JSON
   * (e.g. a full CV extraction) and silently truncates mid-response — always set this
   * explicitly rather than relying on the model's default. */
  numPredict?: number;
}

export interface AIProvider {
  name: string;
  complete(system: string, user: string, opts?: CompleteOptions): Promise<string>;
}

async function ollamaAlive(ollamaUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function checkOllamaConnection(): Promise<{
  alive: boolean;
  models: string[];
  ollamaUrl: string;
}> {
  const settings = getSettings();
  try {
    const res = await fetch(`${settings.ollamaUrl}/api/tags`, {
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return { alive: false, models: [], ollamaUrl: settings.ollamaUrl };
    const data = await res.json();
    const models = (data.models ?? []).map((m: { name: string }) => m.name);
    return { alive: true, models, ollamaUrl: settings.ollamaUrl };
  } catch {
    return { alive: false, models: [], ollamaUrl: settings.ollamaUrl };
  }
}

function ollamaProvider(ollamaUrl: string, defaultModel: string): AIProvider {
  return {
    name: `ollama:${defaultModel}`,
    async complete(system, user, opts) {
      const model = opts?.model || defaultModel;
      const res = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          options: { temperature: opts?.temperature ?? 0, num_predict: opts?.numPredict ?? 4096 },
          ...(opts?.json ? { format: "json" } : {}),
          messages: [
            { role: "system", content: system },
            {
              role: "user",
              content: user,
              ...(opts?.images ? { images: opts.images } : {}),
            },
          ],
        }),
      });
      if (!res.ok) throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
      const data = await res.json();
      return data.message?.content ?? "";
    },
  };
}

/**
 * Local-first: this app only talks to Ollama, never a cloud AI provider, unless
 * the user explicitly reconfigures it in a future version. When Ollama isn't
 * reachable, callers should treat `null` as "demo mode" and degrade gracefully
 * rather than crash — see routes that call this.
 */
export async function getProvider(): Promise<AIProvider | null> {
  const settings = getSettings();
  if (!(await ollamaAlive(settings.ollamaUrl))) return null;
  return ollamaProvider(settings.ollamaUrl, settings.reasoningModel);
}

export async function getVisionProvider(): Promise<AIProvider | null> {
  const settings = getSettings();
  if (!(await ollamaAlive(settings.ollamaUrl))) return null;
  return ollamaProvider(settings.ollamaUrl, settings.visionModel);
}
