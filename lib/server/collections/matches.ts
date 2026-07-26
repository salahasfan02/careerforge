import { readStore, updateStore } from "../store";
import type { MatchAnalysis } from "../types";

const FILE = "matches.json";

interface MatchStore {
  items: MatchAnalysis[];
  nextId: number;
}

const DEFAULT_STORE: MatchStore = { items: [], nextId: 1 };

export function listMatchesForJob(jobDescriptionId: number): MatchAnalysis[] {
  return readStore(FILE, DEFAULT_STORE)
    .items.filter((m) => m.jobDescriptionId === jobDescriptionId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getLatestMatch(jobDescriptionId: number): MatchAnalysis | null {
  return listMatchesForJob(jobDescriptionId)[0] ?? null;
}

export function findByInputHash(jobDescriptionId: number, inputHash: string): MatchAnalysis | null {
  return (
    listMatchesForJob(jobDescriptionId).find((m) => m.inputHash === inputHash) ?? null
  );
}

export async function createMatch(entry: Omit<MatchAnalysis, "id" | "createdAt">): Promise<MatchAnalysis> {
  let created!: MatchAnalysis;
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    const id = store.nextId++;
    created = { ...entry, id, createdAt: new Date().toISOString() };
    store.items.push(created);
  });
  return created;
}
