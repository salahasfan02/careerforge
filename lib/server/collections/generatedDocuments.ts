import { readStore, updateStore } from "../store";
import type { GeneratedDocument } from "../types";

const FILE = "generatedDocuments.json";

interface DocStore {
  items: GeneratedDocument[];
  nextId: number;
}

const DEFAULT_STORE: DocStore = { items: [], nextId: 1 };

export function listGeneratedDocuments(jobDescriptionId?: number): GeneratedDocument[] {
  const items = readStore(FILE, DEFAULT_STORE).items;
  const filtered = jobDescriptionId ? items.filter((d) => d.jobDescriptionId === jobDescriptionId) : items;
  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getGeneratedDocument(id: number): GeneratedDocument | null {
  return readStore(FILE, DEFAULT_STORE).items.find((d) => d.id === id) ?? null;
}

export async function createGeneratedDocument(
  entry: Omit<GeneratedDocument, "id" | "createdAt">
): Promise<GeneratedDocument> {
  let created!: GeneratedDocument;
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    const id = store.nextId++;
    created = { ...entry, id, createdAt: new Date().toISOString() };
    store.items.push(created);
  });
  return created;
}

export async function deleteGeneratedDocument(id: number): Promise<void> {
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    store.items = store.items.filter((d) => d.id !== id);
  });
}
