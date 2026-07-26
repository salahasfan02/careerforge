import { readStore, updateStore } from "../store";
import type { JobDescription, JobRequirementItem } from "../types";

const FILE = "jobs.json";

interface JobStore {
  items: JobDescription[];
  nextId: number;
  nextRequirementId: number;
}

const DEFAULT_STORE: JobStore = { items: [], nextId: 1, nextRequirementId: 1 };

export function listJobs(): JobDescription[] {
  return readStore(FILE, DEFAULT_STORE).items;
}

export function getJob(id: number): JobDescription | null {
  return readStore(FILE, DEFAULT_STORE).items.find((j) => j.id === id) ?? null;
}

export async function createJob(
  entry: Omit<JobDescription, "id" | "createdAt" | "requirementItems" | "extractedAt">
): Promise<JobDescription> {
  let created!: JobDescription;
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    const id = store.nextId++;
    created = {
      ...entry,
      id,
      requirementItems: [],
      extractedAt: null,
      createdAt: new Date().toISOString(),
    };
    store.items.push(created);
  });
  return created;
}

export async function setJobRequirements(
  id: number,
  items: Array<Omit<JobRequirementItem, "id">>,
  meta?: { title?: string; company?: string }
): Promise<JobDescription | null> {
  let updated: JobDescription | null = null;
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    const job = store.items.find((j) => j.id === id);
    if (!job) return;
    job.requirementItems = items.map((item) => ({ ...item, id: store.nextRequirementId++ }));
    job.extractedAt = new Date().toISOString();
    if (meta?.title && !job.title.trim()) job.title = meta.title;
    if (meta?.company && !job.company.trim()) job.company = meta.company;
    updated = job;
  });
  return updated;
}

export async function deleteJob(id: number): Promise<void> {
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    store.items = store.items.filter((j) => j.id !== id);
  });
}
