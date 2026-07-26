"use client";

import { useState } from "react";
import type { ProfileSuggestionResult } from "@/lib/schemas/profileSuggestion";

interface Suggestion {
  id: number;
  suggestedJson: ProfileSuggestionResult;
}

/**
 * The review-and-approve UI shared by every "import a CV into my profile" entry point —
 * nothing here is ever written to the trusted Career Profile until the user unchecks what
 * they don't want and clicks Apply.
 */
export function ProfileSuggestionEditor({ suggestion, onApplied }: { suggestion: Suggestion; onApplied: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const s = suggestion.suggestedJson;
  const [includePersonal, setIncludePersonal] = useState(true);
  const [includedEducation, setIncludedEducation] = useState<Set<number>>(new Set(s.education.map((_, i) => i)));
  const [includedEmployment, setIncludedEmployment] = useState<Set<number>>(new Set(s.employment.map((_, i) => i)));
  const [includedSkills, setIncludedSkills] = useState<Set<number>>(new Set(s.skills.map((_, i) => i)));
  const [includedProjects, setIncludedProjects] = useState<Set<number>>(new Set(s.projects.map((_, i) => i)));
  const [includedCerts, setIncludedCerts] = useState<Set<number>>(new Set(s.certifications.map((_, i) => i)));

  function toggle(set: Set<number>, setSet: (s: Set<number>) => void, i: number) {
    const next = new Set(set);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSet(next);
  }

  async function apply() {
    const approved: ProfileSuggestionResult = {
      personalInfo: includePersonal ? s.personalInfo : undefined,
      education: s.education.filter((_, i) => includedEducation.has(i)),
      employment: s.employment.filter((_, i) => includedEmployment.has(i)),
      skills: s.skills.filter((_, i) => includedSkills.has(i)),
      projects: s.projects.filter((_, i) => includedProjects.has(i)),
      certifications: s.certifications.filter((_, i) => includedCerts.has(i)),
    };
    setApplying(true);
    setError(null);
    try {
      const res = await fetch(`/api/profile/import/${suggestion.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(approved),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Apply failed");
      onApplied();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="card p-5">
      <p className="font-medium" style={{ color: "var(--ink)" }}>
        Review suggested entries
      </p>
      <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
        Uncheck anything you don't want added. This is a suggestion parsed from your CV — verify it's
        accurate before approving.
      </p>

      <div className="mt-4 flex flex-col gap-4 text-sm">
        {s.personalInfo && (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={includePersonal} onChange={() => setIncludePersonal(!includePersonal)} />
            Personal info: {s.personalInfo.name} · {s.personalInfo.email}
          </label>
        )}

        {s.employment.length > 0 && (
          <div>
            <p className="font-medium" style={{ color: "var(--ink)" }}>
              Employment
            </p>
            {s.employment.map((job, i) => (
              <label key={i} className="mt-1 flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={includedEmployment.has(i)}
                  onChange={() => toggle(includedEmployment, setIncludedEmployment, i)}
                />
                <span>
                  <strong>{job.jobTitle}</strong> at {job.company} ({job.startDate}–{job.endDate}) —{" "}
                  {job.highlights.length} highlight(s)
                </span>
              </label>
            ))}
          </div>
        )}

        {s.skills.length > 0 && (
          <div>
            <p className="font-medium" style={{ color: "var(--ink)" }}>
              Skills
            </p>
            {s.skills.map((skill, i) => (
              <label key={i} className="mt-1 flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={includedSkills.has(i)}
                  onChange={() => toggle(includedSkills, setIncludedSkills, i)}
                />
                <span>
                  {skill.name} ({skill.level}){skill.evidenceText ? ` — ${skill.evidenceText}` : ""}
                </span>
              </label>
            ))}
          </div>
        )}

        {s.education.length > 0 && (
          <div>
            <p className="font-medium" style={{ color: "var(--ink)" }}>
              Education
            </p>
            {s.education.map((edu, i) => (
              <label key={i} className="mt-1 flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={includedEducation.has(i)}
                  onChange={() => toggle(includedEducation, setIncludedEducation, i)}
                />
                <span>
                  {edu.degree} in {edu.subject} — {edu.institution}
                </span>
              </label>
            ))}
          </div>
        )}

        {s.projects.length > 0 && (
          <div>
            <p className="font-medium" style={{ color: "var(--ink)" }}>
              Projects
            </p>
            {s.projects.map((p, i) => (
              <label key={i} className="mt-1 flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={includedProjects.has(i)}
                  onChange={() => toggle(includedProjects, setIncludedProjects, i)}
                />
                <span>{p.name}</span>
              </label>
            ))}
          </div>
        )}

        {s.certifications.length > 0 && (
          <div>
            <p className="font-medium" style={{ color: "var(--ink)" }}>
              Certifications
            </p>
            {s.certifications.map((c, i) => (
              <label key={i} className="mt-1 flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={includedCerts.has(i)}
                  onChange={() => toggle(includedCerts, setIncludedCerts, i)}
                />
                <span>{c.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={apply}
        disabled={applying}
        className="mt-4 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        style={{ background: "var(--accent)" }}
      >
        {applying ? "Adding…" : "Add approved items to my profile"}
      </button>
      {error && (
        <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
