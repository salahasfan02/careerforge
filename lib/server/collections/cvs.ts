import { readStore, updateStore } from "../store";
import type { CvRecord, CvStructureAnalysis } from "../types";

const FILE = "cvs.json";

interface CvStore {
  items: CvRecord[];
  nextId: number;
}

const DEFAULT_STORE: CvStore = { items: [], nextId: 1 };

export function listCvs(): CvRecord[] {
  return readStore(FILE, DEFAULT_STORE).items;
}

export function getCv(id: number): CvRecord | null {
  return readStore(FILE, DEFAULT_STORE).items.find((c) => c.id === id) ?? null;
}

export async function createCv(entry: Omit<CvRecord, "id" | "createdAt">): Promise<CvRecord> {
  let created!: CvRecord;
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    const id = store.nextId++;
    created = { ...entry, id, createdAt: new Date().toISOString() };
    store.items.push(created);
  });
  return created;
}

export async function setCvStructureAnalysis(
  id: number,
  analysis: CvStructureAnalysis
): Promise<void> {
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    const cv = store.items.find((c) => c.id === id);
    if (cv) {
      cv.structureJson = analysis;
    }
  });
}

export async function deleteCv(id: number): Promise<void> {
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    store.items = store.items.filter((c) => c.id !== id);
  });
}
