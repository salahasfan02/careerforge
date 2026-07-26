import type { ExtractResult } from "./types";

export function extractPlainText(buffer: Buffer): ExtractResult {
  const text = buffer.toString("utf8");
  return { text, warnings: [], hasTextLayer: text.trim().length > 0 };
}
