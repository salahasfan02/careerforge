"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BackgroundJob, JobDescription, MatchAnalysis, MatchCategory } from "@/lib/server/types";
import { useBackgroundJob } from "@/hooks/useBackgroundJob";
import { GeneratingBanner } from "./GeneratingBanner";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { MatchItemList } from "./MatchItemList";

export function JobMatchPanel({
  job,
  initialMatch,
  profileVersion,
  profileUsable,
  initialActiveJob,
}: {
  job: JobDescription;
  initialMatch: MatchAnalysis | null;
  profileVersion: number;
  profileUsable: boolean;
  initialActiveJob: BackgroundJob | null;
}) {
  const router = useRouter();
  const [match, setMatch] = useState(initialMatch);
  const [activeJobId, setActiveJobId] = useState<number | null>(initialActiveJob?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MatchCategory | null>(null);

  const activeJob = useBackgroundJob(activeJobId, async (finished) => {
    setActiveJobId(null);
    if (finished.status === "error") {
      setError(finished.error);
      return;
    }
    if (finished.kind === "job_match") {
      const res = await fetch(`/api/jobs/${job.id}/match`);
      setMatch(await res.json());
      setSelectedCategory(null);
    } else {
      // job_extract changed job.requirementItems, which lives on the server-component prop
      router.refresh();
    }
  });

  const isStale = match !== null && match.profileVersionAtRun < profileVersion;

  async function extractRequirements() {
    setError(null);
    const res = await fetch(`/api/jobs/${job.id}/extract`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Extraction failed");
      return;
    }
    setActiveJobId(data.id);
  }

  async function runMatch() {
    setError(null);
    const res = await fetch(`/api/jobs/${job.id}/match`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Match failed");
      return;
    }
    setActiveJobId(data.id);
  }

  const busy = activeJob?.status === "running";

  if (job.requirementItems.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {activeJob && <GeneratingBanner job={activeJob} />}
        <div className="card p-6">
          <p className="font-medium" style={{ color: "var(--ink)" }}>
            Extract requirements first
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
            The AI will read this job description and pull out required skills, preferred skills,
            responsibilities, qualifications, experience requirements, soft skills, and keywords.
          </p>
          <button
            onClick={extractRequirements}
            disabled={busy}
            className="mt-3 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: "var(--accent)" }}
          >
            {busy ? "Extracting…" : "Extract requirements"}
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

  if (!profileUsable) {
    return (
      <div className="card p-6">
        <p className="font-medium" style={{ color: "var(--ink)" }}>
          Build your Career Profile to run a match
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
          Matching compares this job against your Career Profile, which is currently empty.
        </p>
        <Link href="/profile" className="mt-3 inline-block rounded-md px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--accent)" }}>
          Go to Career Profile
        </Link>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex flex-col gap-4">
        {activeJob && <GeneratingBanner job={activeJob} />}
        <div className="card p-6">
          <p className="font-medium" style={{ color: "var(--ink)" }}>
            Ready to match
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
            {job.requirementItems.length} requirements extracted. Run the match against your Career Profile.
          </p>
          <button
            onClick={runMatch}
            disabled={busy}
            className="mt-3 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: "var(--accent)" }}
          >
            {busy ? "Matching…" : "Run match"}
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

  const itemsForCategory = selectedCategory
    ? match.matchItems.filter((i) => i.category === selectedCategory)
    : null;

  return (
    <div className="flex flex-col gap-4">
      {activeJob && <GeneratingBanner job={activeJob} />}

      {isStale && !busy && (
        <div className="card flex items-center justify-between p-3" style={{ background: "var(--partial-bg)" }}>
          <p className="text-sm" style={{ color: "var(--partial)" }}>
            Your Career Profile has changed since this match ran — the score below may be out of date.
          </p>
          <button
            onClick={runMatch}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-white"
            style={{ background: "var(--accent)" }}
          >
            Re-run match
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link href={`/jobs/${job.id}/ideal-cv`} className="text-sm font-medium" style={{ color: "var(--accent)" }}>
          Show me the ideal CV for this job →
        </Link>
        <button onClick={runMatch} disabled={busy} className="text-sm" style={{ color: "var(--ink-muted)" }}>
          {busy ? "Re-running…" : "Re-run match"}
        </button>
      </div>

      <ScoreBreakdown analysis={match} onSelectCategory={setSelectedCategory} selectedCategory={selectedCategory} />

      {itemsForCategory && (
        <div className="card p-5">
          <MatchItemList items={itemsForCategory} />
        </div>
      )}
    </div>
  );
}
