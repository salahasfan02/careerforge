import { notFound } from "next/navigation";
import { getJob } from "@/lib/server/collections/jobs";
import { getLatestBlueprint } from "@/lib/server/collections/blueprints";
import { getLatestMatch } from "@/lib/server/collections/matches";
import { listJobsForRef } from "@/lib/server/collections/backgroundJobs";
import { IdealCvBlueprintView } from "@/components/IdealCvBlueprintView";

export default async function IdealCvPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(Number(id));
  if (!job) notFound();

  const blueprint = getLatestBlueprint(job.id);
  const match = getLatestMatch(job.id);
  const activeJob = listJobsForRef("job_descriptions", job.id, "job_blueprint").find((j) => j.status === "running") ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
          Ideal CV for: {job.title || "Untitled role"}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
          {job.company}
        </p>
      </div>
      <IdealCvBlueprintView jobId={job.id} initialBlueprint={blueprint} match={match} initialActiveJob={activeJob} />
    </div>
  );
}
