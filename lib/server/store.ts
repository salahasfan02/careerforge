import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

// Per-filename write queues so concurrent route handlers don't interleave writes
// to the same JSON file. Cached on globalThis so Next.js dev-mode HMR doesn't
// reset it between module reloads (mirrors the singleton-on-globalThis pattern
// used for stateful resources elsewhere in this monorepo).
const globalForStore = globalThis as unknown as {
  __careerforgeWriteQueues?: Map<string, Promise<unknown>>;
};
const writeQueues = globalForStore.__careerforgeWriteQueues ?? new Map<string, Promise<unknown>>();
globalForStore.__careerforgeWriteQueues = writeQueues;

function filePath(name: string): string {
  return path.join(DATA_DIR, name);
}

export function readStore<T>(name: string, defaultValue: T): T {
  const file = filePath(name);
  if (!fs.existsSync(file)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(defaultValue, null, 2));
    return structuredClone(defaultValue);
  }
  const raw = fs.readFileSync(file, "utf8");
  return JSON.parse(raw) as T;
}

function writeStoreNow(name: string, data: unknown): void {
  const file = filePath(name);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

/** Serializes writes to the same file so concurrent requests can't interleave. */
export function writeStore(name: string, data: unknown): Promise<void> {
  const previous = writeQueues.get(name) ?? Promise.resolve();
  const next = previous
    .catch(() => {
      // swallow so one failed write doesn't permanently jam the queue
    })
    .then(() => writeStoreNow(name, data));
  writeQueues.set(name, next);
  return next;
}

/** Read-modify-write helper: loads, mutates, persists, and returns the updated value. */
export async function updateStore<T>(
  name: string,
  defaultValue: T,
  mutate: (current: T) => T | void
): Promise<T> {
  const current = readStore(name, defaultValue);
  const result = mutate(current);
  const next = result === undefined ? current : result;
  await writeStore(name, next);
  return next;
}
