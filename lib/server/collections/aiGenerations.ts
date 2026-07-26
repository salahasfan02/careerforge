import { readStore, updateStore } from "../store";
import type { AiGenerationLogEntry } from "../types";

const FILE = "aiGenerations.json";

interface LogStore {
  items: AiGenerationLogEntry[];
  nextId: number;
}

const DEFAULT_STORE: LogStore = { items: [], nextId: 1 };

const MAX_ENTRIES = 500;

export function listGenerations(refTable?: string, refId?: number): AiGenerationLogEntry[] {
  const items = readStore(FILE, DEFAULT_STORE).items;
  if (!refTable) return items;
  return items.filter((e) => e.refTable === refTable && e.refId === refId);
}

export async function logGeneration(
  entry: Omit<AiGenerationLogEntry, "id" | "createdAt">
): Promise<void> {
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    const id = store.nextId++;
    store.items.push({ ...entry, id, createdAt: new Date().toISOString() });
    // append-only log, but cap size so it doesn't grow unbounded on a long-lived install
    if (store.items.length > MAX_ENTRIES) {
      store.items = store.items.slice(store.items.length - MAX_ENTRIES);
    }
  });
}
