import { notFound } from "next/navigation";
import { getCv } from "@/lib/server/collections/cvs";
import { listJobsForRef } from "@/lib/server/collections/backgroundJobs";
import { ImportSuggestionReview } from "@/components/ImportSuggestionReview";
import type { AtsIssue } from "@/lib/server/types";

const SEVERITY_META: Record<AtsIssue["severity"], { color: string; bg: string; label: string }> = {
  info: { color: "var(--strong)", bg: "var(--strong-bg)", label: "Working well" },
  warning: { color: "var(--partial)", bg: "var(--partial-bg)", label: "Could cause problems" },
  risk: { color: "var(--danger)", bg: "rgba(179,38,30,0.1)", label: "High risk" },
};

export default async function CvDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cv = getCv(Number(id));
  if (!cv) notFound();

  const analysis = cv.structureJson;
  const activeImportJob =
    listJobsForRef("cvs", cv.id, "profile_import_suggestion").find((j) => j.status === "running") ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
          {cv.name}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
          Uploaded {new Date(cv.createdAt).toLocaleString()}
        </p>
      </div>

      {analysis && (
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--ink-muted)" }}>
                ATS Compatibility
              </p>
              <p className="text-3xl font-bold" style={{ color: "var(--ink)" }}>
                {analysis.atsScore}
                <span className="text-base font-medium" style={{ color: "var(--ink-muted)" }}>
                  /100
                </span>
              </p>
            </div>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold uppercase"
              style={{
                background: analysis.atsRisk === "low" ? "var(--strong-bg)" : analysis.atsRisk === "medium" ? "var(--partial-bg)" : "rgba(179,38,30,0.1)",
                color: analysis.atsRisk === "low" ? "var(--strong)" : analysis.atsRisk === "medium" ? "var(--partial)" : "var(--danger)",
              }}
            >
              {analysis.atsRisk} risk
            </span>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
            No tool can guarantee passing every ATS — different employers use different systems. This
            reflects common, well-documented risk factors.
          </p>

          <div className="mt-5 flex flex-col gap-3">
            {analysis.issues.map((issue, i) => {
              const meta = SEVERITY_META[issue.severity];
              return (
                <div key={i} className="rounded-lg p-3" style={{ background: meta.bg }}>
                  <p className="text-xs font-semibold uppercase" style={{ color: meta.color }}>
                    {meta.label}
                  </p>
                  <p className="mt-1 text-sm font-medium" style={{ color: "var(--ink)" }}>
                    {issue.title}
                  </p>
                  {issue.whatIsWorking && (
                    <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
                      {issue.whatIsWorking}
                    </p>
                  )}
                  {issue.whatCouldCauseProblems && (
                    <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
                      <strong>Why it matters:</strong> {issue.whatCouldCauseProblems}
                    </p>
                  )}
                  {issue.howToFix && (
                    <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
                      <strong>How to fix:</strong> {issue.howToFix}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ImportSuggestionReview cvId={cv.id} initialActiveJob={activeImportJob} />

      <details className="card p-5">
        <summary className="cursor-pointer text-sm font-medium" style={{ color: "var(--ink)" }}>
          View extracted text
        </summary>
        <pre className="mt-3 whitespace-pre-wrap text-xs" style={{ color: "var(--ink-2)" }}>
          {cv.rawText || "(no text extracted)"}
        </pre>
      </details>
    </div>
  );
}
