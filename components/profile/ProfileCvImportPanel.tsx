"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import type { ProfileSuggestionResult } from "@/lib/schemas/profileSuggestion";
import type { BackgroundJob } from "@/lib/server/types";
import { useBackgroundJob } from "@/hooks/useBackgroundJob";
import { GeneratingBanner } from "@/components/GeneratingBanner";
import { ProfileSuggestionEditor } from "./ProfileSuggestionEditor";

interface Suggestion {
  id: number;
  suggestedJson: ProfileSuggestionResult;
}

/**
 * Upload here is scoped to ONE purpose: extract structured entries to fill in the Career
 * Profile. Unlike My CVs, this never creates a persisted CV record and never runs ATS
 * analysis — it hits /api/profile/import-from-file, not /api/cvs.
 */
export function ProfileCvImportPanel({ initialActiveJob }: { initialActiveJob?: BackgroundJob | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeJobId, setActiveJobId] = useState<number | null>(initialActiveJob?.id ?? null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    setFileName(file.name);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/profile/import-from-file", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setActiveJobId(data.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  if (applied) {
    return (
      <div className="card p-5" style={{ borderColor: "var(--strong)" }}>
        <p className="font-medium" style={{ color: "var(--strong)" }}>
          Added to your Career Profile
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
          Edit or remove anything below at any time.
        </p>
      </div>
    );
  }

  if (suggestion) {
    return <ProfileSuggestionEditor suggestion={suggestion} onApplied={() => setApplied(true)} />;
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--accent-soft)" }}>
          <UploadCloud size={16} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <p className="font-medium" style={{ color: "var(--ink)" }}>
            Upload a CV to import
          </p>
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            Just fills in your Career Profile — this doesn't add it to My CVs or run any ATS analysis.
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading || activeJob?.status === "running"}
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {uploading ? "Uploading…" : "Choose file"}
        </button>
        {fileName && !error && (
          <span className="text-sm" style={{ color: "var(--ink-muted)" }}>
            {fileName}
          </span>
        )}
        {error && (
          <span className="text-sm" style={{ color: "var(--danger)" }}>
            {error}
          </span>
        )}
      </div>

      {activeJob && (
        <div className="mt-3">
          <GeneratingBanner job={activeJob} />
        </div>
      )}
    </div>
  );
}
