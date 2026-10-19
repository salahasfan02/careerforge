import { readStore, updateStore } from "../store";
import type { Settings } from "../types";

const FILE = "settings.json";

const DEFAULT_SETTINGS: Settings = {
  ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",
  reasoningModel: process.env.CV_TAILOR_REASONING_MODEL || "qwen2.5:14b",
  embeddingModel: process.env.CV_TAILOR_EMBEDDING_MODEL || "nomic-embed-text",
  visionModel: process.env.CV_TAILOR_VISION_MODEL || "granite3.2-vision",
};

export function getSettings(): Settings {
  return readStore(FILE, DEFAULT_SETTINGS);
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  await updateStore(FILE, DEFAULT_SETTINGS, () => settings);
  return settings;
}
