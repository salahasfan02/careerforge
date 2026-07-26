import { readStore, updateStore } from "../store";
import type { ImportSuggestionStatus, ProfileImportSuggestion } from "../types";

const FILE = "profileImportSuggestions.json";

interface SuggestionStore {
  items: ProfileImportSuggestion[];
  nextId: number;
}

const DEFAULT_STORE: SuggestionStore = { items: [], nextId: 1 };

export function getSuggestion(id: number): ProfileImportSuggestion | null {
  return readStore(FILE, DEFAULT_STORE).items.find((s) => s.id === id) ?? null;
}

export function listSuggestions(): ProfileImportSuggestion[] {
  return readStore(FILE, DEFAULT_STORE).items;
}

export async function createSuggestion(
  cvId: number | null,
  suggestedJson: unknown
): Promise<ProfileImportSuggestion> {
  let created!: ProfileImportSuggestion;
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    const id = store.nextId++;
    created = {
      id,
      cvId,
      suggestedJson,
      status: "pending",
      appliedJson: null,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };
    store.items.push(created);
  });
  return created;
}

export async function resolveSuggestion(
  id: number,
  status: ImportSuggestionStatus,
  appliedJson: unknown | null
): Promise<void> {
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    const s = store.items.find((s) => s.id === id);
    if (s) {
      s.status = status;
      s.appliedJson = appliedJson;
      s.resolvedAt = new Date().toISOString();
    }
  });
}
