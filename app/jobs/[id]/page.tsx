import { notFound } from "next/navigation";
import { getJob } from "@/lib/server/collections/jobs";
import { getLatestMatch } from "@/lib/server/collections/matches";
import { getProfile, isProfileUsable } from "@/lib/server/collections/profile";
import { listJobsForRef } from "@/lib/server/collections/backgroundJobs";
import { JobMatchPanel } from "@/components/JobMatchPanel";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(Number(id));
  if (!job) notFound();

  const match = getLatestMatch(job.id);
  const profile = getProfile();

  // Whatever's still running for this job (extract or match) — set server-side so reloading
  // or returning to this page later shows live progress instead of a stale "start" button.
  const activeJob =
    listJobsForRef("job_descriptions", job.id, "job_extract").find((j) => j.status === "running") ??
    listJobsForRef("job_descriptions", job.id, "job_match").find((j) => j.status === "running") ??
    null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
          {job.title || "Untitled role"}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
          {job.company || "Unknown company"}
        </p>
      </div>

      <JobMatchPanel
        job={job}
        initialMatch={match}
        profileVersion={profile.version}
        profileUsable={isProfileUsable(profile)}
        initialActiveJob={activeJob}
      />

      <details className="card p-5">
        <summary className="cursor-pointer text-sm font-medium" style={{ color: "var(--ink)" }}>
          View original job description text
        </summary>
        <pre className="mt-3 whitespace-pre-wrap text-xs" style={{ color: "var(--ink-2)" }}>
          {job.rawText}
        </pre>
      </details>
    </div>
  );
}
