"use client";

import { useState } from "react";
import type { BackgroundJob, IdealCvBlueprint, MatchAnalysis } from "@/lib/server/types";
import { useBackgroundJob } from "@/hooks/useBackgroundJob";
import { GeneratingBanner } from "./GeneratingBanner";
import { MatchTypeBadge } from "./MatchTypeBadge";

const CATEGORY_WEIGHT_ORDER: MatchAnalysis["matchItems"][number]["category"][] = [
  "required_skills",
  "experience",
  "responsibilities",
  "preferred_skills",
  "education",
  "keywords",
];

export function IdealCvBlueprintView({
  jobId,
  initialBlueprint,
  match,
  initialActiveJob,
}: {
  jobId: number;
  initialBlueprint: IdealCvBlueprint | null;
  match: MatchAnalysis | null;
  initialActiveJob: BackgroundJob | null;
}) {
  const [blueprint, setBlueprint] = useState(initialBlueprint);
  const [activeJobId, setActiveJobId] = useState<number | null>(initialActiveJob?.id ?? null);
  const [error, setError] = useState<string | null>(null);

  const activeJob = useBackgroundJob(activeJobId, async (finished) => {
    setActiveJobId(null);
    if (finished.status === "error") {
      setError(finished.error);
      return;
    }
    const res = await fetch(`/api/jobs/${jobId}/blueprint`);
    setBlueprint(await res.json());
  });

  async function generate() {
    setError(null);
    const res = await fetch(`/api/jobs/${jobId}/blueprint`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Generation failed");
      return;
    }
    setActiveJobId(data.id);
  }

  if (!blueprint) {
    return (
      <div className="flex flex-col gap-4">
        {activeJob && <GeneratingBanner job={activeJob} />}
        <div className="card p-6">
        <p className="font-medium" style={{ color: "var(--ink)" }}>
          Generate the ideal CV blueprint
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
          Shows what a strong candidate's CV would contain for this specific job — an illustrative
          example, not a claim about your own experience.
        </p>
        <button
          onClick={generate}
          disabled={activeJob?.status === "running"}
          className="mt-3 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {activeJob?.status === "running" ? "Generating…" : "Generate blueprint"}
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

  const opportunities = match
    ? [...match.matchItems]
        .filter((i) => i.matchType === "missing" || i.matchType === "underdeveloped" || i.matchType === "partial")
        .sort((a, b) => CATEGORY_WEIGHT_ORDER.indexOf(a.category) - CATEGORY_WEIGHT_ORDER.indexOf(b.category))
        .slice(0, 6)
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-4" style={{ background: "var(--accent-soft)" }}>
        <p className="text-sm" style={{ color: "var(--accent-strong)" }}>
          This is an illustrative blueprint of what a strong candidate's CV might contain for this
          role — it is not a claim about your experience. Compare it against your own profile below.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold" style={{ color: "var(--ink)" }}>
          Ideal CV structure
        </h2>
        <ol className="mt-2 list-decimal pl-5 text-sm" style={{ color: "var(--ink-2)" }}>
          {blueprint.structure.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold" style={{ color: "var(--ink)" }}>
          Example professional summary <span className="text-xs font-normal" style={{ color: "var(--ink-muted)" }}>(illustrative example)</span>
        </h2>
        <p className="mt-2 text-sm italic" style={{ color: "var(--ink-2)" }}>
          “{blueprint.summaryExample}”
        </p>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold" style={{ color: "var(--ink)" }}>
          Skills a strong candidate would show
        </h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: "var(--ink-muted)" }}>
              Required
            </p>
            <ul className="mt-1 flex flex-col gap-1 text-sm" style={{ color: "var(--ink-2)" }}>
              {blueprint.requiredSkills.map((s, i) => (
                <li key={i}>✓ {s}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: "var(--ink-muted)" }}>
              Preferred
            </p>
            <ul className="mt-1 flex flex-col gap-1 text-sm" style={{ color: "var(--ink-2)" }}>
              {blueprint.preferredSkills.map((s, i) => (
                <li key={i}>○ {s}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold" style={{ color: "var(--ink)" }}>
          Experience a strong candidate would demonstrate
        </h2>
        <ul className="mt-2 list-disc pl-5 text-sm" style={{ color: "var(--ink-2)" }}>
          {blueprint.experienceExpectations.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold" style={{ color: "var(--ink)" }}>
          Achievement patterns worth emulating <span className="text-xs font-normal" style={{ color: "var(--ink-muted)" }}>(examples, not claims)</span>
        </h2>
        <ul className="mt-2 list-disc pl-5 text-sm" style={{ color: "var(--ink-2)" }}>
          {blueprint.achievementExamplePatterns.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>

      {match && (
        <div className="card p-6">
          <h2 className="font-semibold" style={{ color: "var(--ink)" }}>
            Your biggest opportunities
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
            The highest-weighted requirements where your profile isn't yet a strong match.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {opportunities.length === 0 ? (
              <li className="text-sm" style={{ color: "var(--ink-muted)" }}>
                No major gaps found — your profile strongly matches this role's key requirements.
              </li>
            ) : (
              opportunities.map((item) => (
                <li key={item.requirementItemId} className="flex items-center justify-between rounded-lg p-2" style={{ background: "var(--surface-2)" }}>
                  <span className="text-sm" style={{ color: "var(--ink)" }}>
                    {item.requirementText}
                  </span>
                  <MatchTypeBadge type={item.matchType} />
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
