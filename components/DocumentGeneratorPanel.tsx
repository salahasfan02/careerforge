"use client";

import { useState } from "react";
import type { GeneratedDocument, GeneratedDocumentType } from "@/lib/server/types";
import { useBackgroundJob } from "@/hooks/useBackgroundJob";
import { GeneratingBanner } from "./GeneratingBanner";
import { DeleteButton } from "./DeleteButton";

interface JobOption {
  id: number;
  label: string;
}

const TYPE_LABELS: Record<GeneratedDocumentType, string> = {
  cover_letter: "Cover Letter",
  recruiter_message: "Recruiter Message",
  supporting_statement: "Supporting Statement",
  personal_statement: "Personal Statement",
};

export function DocumentGeneratorPanel({
  allowedTypes,
  jobs,
  initialDocuments,
}: {
  allowedTypes: GeneratedDocumentType[];
  jobs: JobOption[];
  initialDocuments: GeneratedDocument[];
}) {
  const [type, setType] = useState<GeneratedDocumentType>(allowedTypes[0]);
  const [jobId, setJobId] = useState<number | "">(jobs[0]?.id ?? "");
  const [maxWords, setMaxWords] = useState(400);
  const [style, setStyle] = useState("Professional");
  const [useStarExamples, setUseStarExamples] = useState(true);
  const [documents, setDocuments] = useState(initialDocuments);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeJob = useBackgroundJob(activeJobId, async (finished) => {
    setActiveJobId(null);
    if (finished.status === "error") {
      setError(finished.error);
      return;
    }
    if (finished.resultRef) {
      const res = await fetch(`/api/documents/${finished.resultRef.id}`);
      const doc = await res.json();
      setDocuments((docs) => [doc, ...docs]);
    }
  });

  async function generate() {
    setError(null);
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, jobId: jobId || undefined, maxWords, style, useStarExamples }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Generation failed");
      return;
    }
    setActiveJobId(data.id);
  }

  const loading = activeJob?.status === "running";

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span style={{ color: "var(--ink-2)" }}>Document type</span>
            <select
              className="rounded-md border px-2 py-1.5"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              value={type}
              onChange={(e) => setType(e.target.value as GeneratedDocumentType)}
            >
              {allowedTypes.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span style={{ color: "var(--ink-2)" }}>Job (optional, improves relevance)</span>
            <select
              className="rounded-md border px-2 py-1.5"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              value={jobId}
              onChange={(e) => setJobId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">No specific job</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span style={{ color: "var(--ink-2)" }}>Maximum length (words)</span>
            <input
              type="number"
              className="rounded-md border px-2 py-1.5"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              value={maxWords}
              onChange={(e) => setMaxWords(Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span style={{ color: "var(--ink-2)" }}>Writing style</span>
            <select
              className="rounded-md border px-2 py-1.5"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              value={style}
              onChange={(e) => setStyle(e.target.value)}
            >
              <option>Professional</option>
              <option>Enthusiastic</option>
              <option>Formal</option>
              <option>Concise</option>
            </select>
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={useStarExamples} onChange={() => setUseStarExamples(!useStarExamples)} />
          Use STAR examples where appropriate
        </label>
        <button
          onClick={generate}
          disabled={loading}
          className="mt-3 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {loading ? "Generating…" : "Generate draft"}
        </button>
        {error && (
          <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
        {activeJob && (
          <div className="mt-3">
            <GeneratingBanner job={activeJob} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {documents.length === 0 && (
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            No drafts generated yet.
          </p>
        )}
        {documents.map((doc) => (
          <div key={doc.id} className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                {TYPE_LABELS[doc.type]} · {doc.wordCount} words
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  {new Date(doc.createdAt).toLocaleString()}
                </span>
                <DeleteButton
                  url={`/api/documents/${doc.id}`}
                  confirmMessage="Delete this draft? This can't be undone."
                  onDeleted={() => setDocuments((docs) => docs.filter((d) => d.id !== doc.id))}
                />
              </div>
            </div>
            <div className="mt-2 rounded-md p-3 text-xs" style={{ background: "var(--partial-bg)", color: "var(--partial)" }}>
              AI-generated draft — review carefully for accuracy before sending. Verify every specific claim
              against your actual experience.
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
              {doc.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
