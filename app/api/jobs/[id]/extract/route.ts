import { NextRequest, NextResponse } from "next/server";
import { getJob, setJobRequirements } from "@/lib/server/collections/jobs";
import { extractJobRequirements } from "@/lib/pipeline/extractJobRequirements";
import { startBackgroundJob } from "@/lib/server/backgroundRunner";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(Number(id));
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const backgroundJob = await startBackgroundJob({
    kind: "job_extract",
    label: `Extracting requirements — ${job.title || "Untitled role"}`,
    refTable: "job_descriptions",
    refId: job.id,
    task: async () => {
      const result = await extractJobRequirements(job.id, job.rawText);
      await setJobRequirements(job.id, result.items, { title: result.title, company: result.company });
      return { table: "job_descriptions", id: job.id };
    },
  });

  return NextResponse.json(backgroundJob);
}
