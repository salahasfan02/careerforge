"use client";

import { useState } from "react";
import type { Settings } from "@/lib/server/types";

export function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const [form, setForm] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [connection, setConnection] = useState<{ alive: boolean; models: string[] } | null>(null);
  const [checking, setChecking] = useState(false);

  async function testConnection() {
    setChecking(true);
    try {
      const res = await fetch("/api/ai/test-connection");
      setConnection(await res.json());
    } finally {
      setChecking(false);
    }
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-6">
        <h2 className="font-semibold" style={{ color: "var(--ink)" }}>
          Local AI Provider
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
          CareerForge only talks to Ollama running on this device. Your CV, career profile, and job
          data never leave this machine.
        </p>

        <div className="mt-4 flex flex-col gap-3 text-sm">
          <label className="flex flex-col gap-1">
            <span style={{ color: "var(--ink-2)" }}>Ollama endpoint</span>
            <input
              className="rounded-md border px-3 py-1.5"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              value={form.ollamaUrl}
              onChange={(e) => setForm({ ...form, ollamaUrl: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span style={{ color: "var(--ink-2)" }}>Reasoning model (extraction, matching, blueprints)</span>
            <input
              className="rounded-md border px-3 py-1.5"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              value={form.reasoningModel}
              onChange={(e) => setForm({ ...form, reasoningModel: e.target.value })}
              list="model-options"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span style={{ color: "var(--ink-2)" }}>Embedding model (semantic matching)</span>
            <input
              className="rounded-md border px-3 py-1.5"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              value={form.embeddingModel}
              onChange={(e) => setForm({ ...form, embeddingModel: e.target.value })}
              list="model-options"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span style={{ color: "var(--ink-2)" }}>Vision model (CV image OCR)</span>
            <input
              className="rounded-md border px-3 py-1.5"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              value={form.visionModel}
              onChange={(e) => setForm({ ...form, visionModel: e.target.value })}
              list="model-options"
            />
          </label>
          {connection && (
            <datalist id="model-options">
              {connection.models.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: "var(--accent)" }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={testConnection}
            disabled={checking}
            className="rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60"
            style={{ background: "var(--surface-2)", color: "var(--ink)" }}
          >
            {checking ? "Checking…" : "Test connection"}
          </button>
          {saved && (
            <span className="text-sm" style={{ color: "var(--strong)" }}>
              Saved
            </span>
          )}
        </div>

        {connection && (
          <p className="mt-3 text-sm" style={{ color: connection.alive ? "var(--strong)" : "var(--danger)" }}>
            {connection.alive
              ? `Connected — ${connection.models.length} model(s) available locally.`
              : "Couldn't reach Ollama at this endpoint. Make sure it's running (ollama serve)."}
          </p>
        )}
      </div>

      <div className="card p-5" style={{ background: "var(--surface-2)" }}>
        <p className="text-sm" style={{ color: "var(--ink-2)" }}>
          <strong>Privacy:</strong> your CV, personal information, career history, and application data
          remain on this device. Cloud AI is not used by this app — everything above runs through your
          local Ollama installation.
        </p>
      </div>
    </div>
  );
}
