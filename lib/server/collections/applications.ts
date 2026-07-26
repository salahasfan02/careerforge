import { readStore, updateStore } from "../store";
import type { Application, ApplicationStatus } from "../types";

const FILE = "applications.json";

interface ApplicationStore {
  items: Application[];
  nextId: number;
}

const DEFAULT_STORE: ApplicationStore = { items: [], nextId: 1 };

export function listApplications(): Application[] {
  return readStore(FILE, DEFAULT_STORE).items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getApplication(id: number): Application | null {
  return readStore(FILE, DEFAULT_STORE).items.find((a) => a.id === id) ?? null;
}

export async function createApplication(
  entry: Omit<Application, "id" | "createdAt" | "updatedAt">
): Promise<Application> {
  let created!: Application;
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    const id = store.nextId++;
    const now = new Date().toISOString();
    created = { ...entry, id, createdAt: now, updatedAt: now };
    store.items.push(created);
  });
  return created;
}

export async function updateApplication(
  id: number,
  patch: Partial<Omit<Application, "id" | "createdAt">>
): Promise<Application | null> {
  let updated: Application | null = null;
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    const app = store.items.find((a) => a.id === id);
    if (!app) return;
    Object.assign(app, patch, { updatedAt: new Date().toISOString() });
    updated = app;
  });
  return updated;
}

export async function setApplicationStatus(id: number, status: ApplicationStatus): Promise<Application | null> {
  return updateApplication(id, { status });
}

export async function deleteApplication(id: number): Promise<void> {
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    store.items = store.items.filter((a) => a.id !== id);
  });
}
