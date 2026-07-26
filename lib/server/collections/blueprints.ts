import { readStore, updateStore } from "../store";
import type { IdealCvBlueprint } from "../types";

const FILE = "blueprints.json";

interface BlueprintStore {
  items: IdealCvBlueprint[];
  nextId: number;
}

const DEFAULT_STORE: BlueprintStore = { items: [], nextId: 1 };

export function getLatestBlueprint(jobDescriptionId: number): IdealCvBlueprint | null {
  const items = readStore(FILE, DEFAULT_STORE)
    .items.filter((b) => b.jobDescriptionId === jobDescriptionId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return items[0] ?? null;
}

export async function createBlueprint(
  entry: Omit<IdealCvBlueprint, "id" | "createdAt">
): Promise<IdealCvBlueprint> {
  let created!: IdealCvBlueprint;
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    const id = store.nextId++;
    created = { ...entry, id, createdAt: new Date().toISOString() };
    store.items.push(created);
  });
  return created;
}
