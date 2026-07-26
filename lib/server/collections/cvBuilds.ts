import { readStore, updateStore } from "../store";
import type { CvBuild } from "../types";

const FILE = "cvBuilds.json";

interface CvBuildStore {
  items: CvBuild[];
  nextId: number;
}

const DEFAULT_STORE: CvBuildStore = { items: [], nextId: 1 };

export function listCvBuilds(): CvBuild[] {
  return readStore(FILE, DEFAULT_STORE).items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getCvBuild(id: number): CvBuild | null {
  return readStore(FILE, DEFAULT_STORE).items.find((c) => c.id === id) ?? null;
}

export async function createCvBuild(
  entry: Omit<CvBuild, "id" | "createdAt" | "updatedAt">
): Promise<CvBuild> {
  let created!: CvBuild;
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    const id = store.nextId++;
    const now = new Date().toISOString();
    created = { ...entry, id, createdAt: now, updatedAt: now };
    store.items.push(created);
  });
  return created;
}

export async function updateCvBuild(
  id: number,
  patch: Partial<Pick<CvBuild, "name" | "template" | "content">>
): Promise<CvBuild | null> {
  let updated: CvBuild | null = null;
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    const build = store.items.find((c) => c.id === id);
    if (!build) return;
    Object.assign(build, patch, { updatedAt: new Date().toISOString() });
    updated = build;
  });
  return updated;
}

export async function deleteCvBuild(id: number): Promise<void> {
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    store.items = store.items.filter((c) => c.id !== id);
  });
}
