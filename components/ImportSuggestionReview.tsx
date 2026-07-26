"use client";

import { useState } from "react";
import type { ProfileSuggestionResult } from "@/lib/schemas/profileSuggestion";
import type { BackgroundJob } from "@/lib/server/types";
import { useBackgroundJob } from "@/hooks/useBackgroundJob";
import { GeneratingBanner } from "./GeneratingBanner";
import { ProfileSuggestionEditor } from "./profile/ProfileSuggestionEditor";

interface Suggestion {
  id: number;
  suggestedJson: ProfileSuggestionResult;
}

export function ImportSuggestionReview({
  cvId,
  initialActiveJob,
}: {
  cvId: number;
  initialActiveJob?: BackgroundJob | null;
}) {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [activeJobId, setActiveJobId] = useState<number | null>(initialActiveJob?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const activeJob = useBackgroundJob(activeJobId, async (finished) => {
    setActiveJobId(null);
    if (finished.status === "error") {
      setError(finished.error);
      return;
    }
    if (!finished.resultRef) return;
    const res = await fetch(`/api/profile/import/${finished.resultRef.id}`);
    setSuggestion(await res.json());
  });
  const loading = activeJob?.status === "running";

  async function runImport() {
    setError(null);
    const res = await fetch("/api/profile/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Import failed");
      return;
    }
    setActiveJobId(data.id);
  }

  if (applied) {
    return (
      <div className="card p-5" style={{ borderColor: "var(--strong)" }}>
        <p className="font-medium" style={{ color: "var(--strong)" }}>
          Added to your Career Profile
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
          Review it on the Career Profile page — you can edit or remove anything at any time.
        </p>
      </div>
    );
  }

  if (!suggestion) {
    return (
      <div className="flex flex-col gap-3">
        {activeJob && <GeneratingBanner job={activeJob} />}
        <div className="card p-5">
          <p className="font-medium" style={{ color: "var(--ink)" }}>
            Import this CV into your Career Profile
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
            The AI will read this CV and suggest structured entries — nothing is added until you review
            and approve each item below.
          </p>
          <button
            onClick={runImport}
            disabled={loading}
            className="mt-3 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: "var(--accent)" }}
          >
            {loading ? "Reading CV…" : "Suggest profile entries"}
          </button>
          {error && (
            <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  return <ProfileSuggestionEditor suggestion={suggestion} onApplied={() => setApplied(true)} />;
}
