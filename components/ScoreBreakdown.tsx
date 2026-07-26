import type { MatchAnalysis, MatchCategory } from "@/lib/server/types";
import { ScoreGauge } from "./ScoreGauge";

const CATEGORY_LABELS: Record<MatchCategory, string> = {
  required_skills: "Required Skills",
  preferred_skills: "Preferred Skills",
  experience: "Experience",
  education: "Education",
  responsibilities: "Responsibilities",
  keywords: "Keywords",
  achievements: "Achievements",
};

function scoreColor(score: number): string {
  if (score >= 80) return "var(--strong)";
  if (score >= 55) return "var(--partial)";
  return "var(--underdeveloped)";
}

export function ScoreBreakdown({
  analysis,
  onSelectCategory,
  selectedCategory,
}: {
  analysis: MatchAnalysis;
  onSelectCategory?: (c: MatchCategory) => void;
  selectedCategory?: MatchCategory | null;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-5">
        <ScoreGauge score={analysis.overallScore} size={96} />
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--ink-muted)" }}>
            Overall match
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--ink-2)" }}>
            Weighted across required skills, experience, education, responsibilities, keywords, and
            achievements. Click a category below to see exactly why.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {(Object.keys(CATEGORY_LABELS) as MatchCategory[]).map((cat) => {
          const score = analysis.categoryScores[cat];
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory?.(cat)}
              disabled={score === null}
              className="flex flex-col gap-1 rounded-lg p-2 text-left transition-colors disabled:cursor-default"
              style={{ background: isSelected ? "var(--surface-2)" : "transparent" }}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium" style={{ color: "var(--ink)" }}>
                  {CATEGORY_LABELS[cat]}
                </span>
                <span style={{ color: score === null ? "var(--ink-muted)" : scoreColor(score) }}>
                  {score === null ? "N/A — none listed" : `${score}/100`}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                {score !== null && (
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${score}%`, background: scoreColor(score), transition: "width 500ms ease" }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
