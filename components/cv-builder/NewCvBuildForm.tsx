"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CvGenerationMode, CvTemplate } from "@/lib/server/types";
import { CV_TEMPLATES } from "@/lib/cvTemplates";
import { useBackgroundJob } from "@/hooks/useBackgroundJob";
import { GeneratingBanner } from "@/components/GeneratingBanner";

interface Option {
  id: number;
  label: string;
}

export function NewCvBuildForm({ cvs, jobs }: { cvs: Option[]; jobs: Option[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<CvGenerationMode>("tailor");
  const [template, setTemplate] = useState<CvTemplate>("modern");
  const [jobId, setJobId] = useState<number | "">(jobs[0]?.id ?? "");
  const [sourceCvId, setSourceCvId] = useState<number | "">(cvs[0]?.id ?? "");
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeJob = useBackgroundJob(activeJobId, (finished) => {
    if (finished.status === "error") {
      setError(finished.error);
      setActiveJobId(null);
      return;
    }
    if (finished.resultRef) router.push(`/cv-builder/${finished.resultRef.id}`);
  });

  async function generate() {
    setError(null);
    const res = await fetch("/api/cv-builds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        template,
        jobId: mode === "tailor" ? jobId : undefined,
        sourceCvId: mode === "improve" ? sourceCvId : undefined,
      }),
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
    <div className="card p-6">
      <p className="font-medium" style={{ color: "var(--ink)" }}>
        Generate a new CV
      </p>
      <div className="mt-3 flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <ModeCard
            active={mode === "improve"}
            title="Improve My Existing CV"
            desc="Grammar, clarity, structure — no changes to your actual experience."
            onClick={() => setMode("improve")}
          />
          <ModeCard
            active={mode === "tailor"}
            title="Tailor To This Job"
            desc="Prioritises your most relevant experience for a specific job."
            onClick={() => setMode("tailor")}
          />
          <ModeCard
            active={mode === "from_profile"}
            title="Build From My Profile"
            desc="A general CV generated from your full verified Career Profile."
            onClick={() => setMode("from_profile")}
          />
        </div>

        {mode === "improve" && (
          <label className="flex flex-col gap-1 text-sm">
            <span style={{ color: "var(--ink-2)" }}>Source CV</span>
            <select
              className="rounded-md border px-2 py-1.5"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              value={sourceCvId}
              onChange={(e) => setSourceCvId(Number(e.target.value))}
            >
              {cvs.length === 0 && <option value="">No CVs uploaded yet</option>}
              {cvs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {mode === "tailor" && (
          <label className="flex flex-col gap-1 text-sm">
            <span style={{ color: "var(--ink-2)" }}>Target job</span>
            <select
              className="rounded-md border px-2 py-1.5"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              value={jobId}
              onChange={(e) => setJobId(Number(e.target.value))}
            >
              {jobs.length === 0 && <option value="">No jobs analysed yet</option>}
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: "var(--ink-2)" }}>Template</span>
          <select
            className="rounded-md border px-2 py-1.5"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
            value={template}
            onChange={(e) => setTemplate(e.target.value as CvTemplate)}
          >
            {CV_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} — {t.description}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={generate}
          disabled={loading || (mode === "improve" && !sourceCvId) || (mode === "tailor" && !jobId)}
          className="mt-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {loading ? "Generating…" : "Generate CV"}
        </button>
        {error && (
          <p className="text-sm" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
        {activeJob && (
          <div className="mt-1">
            <GeneratingBanner job={activeJob} />
          </div>
        )}
      </div>
    </div>
  );
}

function ModeCard({ active, title, desc, onClick }: { active: boolean; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border p-3 text-left text-sm"
      style={{
        borderColor: active ? "var(--accent)" : "var(--border)",
        background: active ? "var(--accent-soft)" : "var(--surface)",
      }}
    >
      <p className="font-medium" style={{ color: active ? "var(--accent-strong)" : "var(--ink)" }}>
        {title}
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>
        {desc}
      </p>
    </button>
  );
}
