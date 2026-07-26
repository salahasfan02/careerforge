import { readStore, updateStore } from "../store";
import type { BackgroundJob, BackgroundJobKind, BackgroundJobResultRef, BackgroundJobStatus } from "../types";

const FILE = "backgroundJobs.json";

interface JobStore {
  items: BackgroundJob[];
  nextId: number;
}

const DEFAULT_STORE: JobStore = { items: [], nextId: 1 };
const MAX_ENTRIES = 300;

export function getBackgroundJob(id: number): BackgroundJob | null {
  return readStore(FILE, DEFAULT_STORE).items.find((j) => j.id === id) ?? null;
}

/** Active (running) jobs, optionally filtered by kind — used for the global "in progress" indicator. */
export function listActiveJobs(kind?: BackgroundJobKind): BackgroundJob[] {
  return readStore(FILE, DEFAULT_STORE).items.filter(
    (j) => j.status === "running" && (!kind || j.kind === kind)
  );
}

/** Most-recent-first jobs tied to a specific resource — lets a page detect "is something already running for me". */
export function listJobsForRef(refTable: string, refId: number, kind?: BackgroundJobKind): BackgroundJob[] {
  return readStore(FILE, DEFAULT_STORE)
    .items.filter((j) => j.refTable === refTable && j.refId === refId && (!kind || j.kind === kind))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getLatestActiveJobForRef(refTable: string, refId: number, kind: BackgroundJobKind): BackgroundJob | null {
  return listJobsForRef(refTable, refId, kind).find((j) => j.status === "running") ?? null;
}

export async function createBackgroundJob(entry: {
  kind: BackgroundJobKind;
  label: string;
  refTable: string | null;
  refId: number | null;
}): Promise<BackgroundJob> {
  let created!: BackgroundJob;
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    const id = store.nextId++;
    created = {
      ...entry,
      id,
      status: "running",
      resultRef: null,
      error: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    store.items.push(created);
    if (store.items.length > MAX_ENTRIES) {
      store.items = store.items.slice(store.items.length - MAX_ENTRIES);
    }
  });
  return created;
}

export async function completeBackgroundJob(id: number, resultRef: BackgroundJobResultRef): Promise<void> {
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    const job = store.items.find((j) => j.id === id);
    if (job) {
      job.status = "done";
      job.resultRef = resultRef;
      job.completedAt = new Date().toISOString();
    }
  });
}

export async function failBackgroundJob(id: number, error: string): Promise<void> {
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    const job = store.items.find((j) => j.id === id);
    if (job) {
      job.status = "error" as BackgroundJobStatus;
      job.error = error;
      job.completedAt = new Date().toISOString();
    }
  });
}
