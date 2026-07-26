import crypto from "crypto";
import { getSettings } from "../server/collections/settings";
import { findEmbedding, upsertEmbedding } from "../server/collections/embeddings";

export function textHash(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export async function embed(text: string): Promise<number[]> {
  const settings = getSettings();
  const res = await fetch(`${settings.ollamaUrl}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: settings.embeddingModel, prompt: text }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Ollama embeddings error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.embedding as number[];
}

/** Recomputes only when the owner's text has changed since it was last embedded. */
export async function embedCached(ownerType: string, ownerId: number, text: string): Promise<number[]> {
  const hash = textHash(text);
  const existing = findEmbedding(ownerType, ownerId);
  if (existing && existing.textHash === hash) return existing.vector;

  const settings = getSettings();
  const vector = await embed(text);
  await upsertEmbedding({
    ownerType,
    ownerId,
    text,
    textHash: hash,
    vector,
    model: settings.embeddingModel,
  });
  return vector;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
