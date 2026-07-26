import { readStore, updateStore } from "../store";
import type { EmbeddingRecord } from "../types";

const FILE = "embeddings.json";

interface EmbeddingStore {
  items: EmbeddingRecord[];
  nextId: number;
}

const DEFAULT_STORE: EmbeddingStore = { items: [], nextId: 1 };

export function findEmbedding(ownerType: string, ownerId: number): EmbeddingRecord | null {
  return (
    readStore(FILE, DEFAULT_STORE).items.find(
      (e) => e.ownerType === ownerType && e.ownerId === ownerId
    ) ?? null
  );
}

export function listEmbeddings(ownerType: string): EmbeddingRecord[] {
  return readStore(FILE, DEFAULT_STORE).items.filter((e) => e.ownerType === ownerType);
}

export async function upsertEmbedding(
  entry: Omit<EmbeddingRecord, "id" | "createdAt">
): Promise<EmbeddingRecord> {
  let result!: EmbeddingRecord;
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    const existing = store.items.find(
      (e) => e.ownerType === entry.ownerType && e.ownerId === entry.ownerId
    );
    if (existing) {
      Object.assign(existing, entry);
      result = existing;
    } else {
      const id = store.nextId++;
      result = { ...entry, id, createdAt: new Date().toISOString() };
      store.items.push(result);
    }
  });
  return result;
}
