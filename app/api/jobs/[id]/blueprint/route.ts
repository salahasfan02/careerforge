import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/server/collections/jobs";
import { getLatestBlueprint, createBlueprint } from "@/lib/server/collections/blueprints";
import { generateIdealCvBlueprint } from "@/lib/pipeline/idealCvBlueprint";
import { startBackgroundJob } from "@/lib/server/backgroundRunner";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(getLatestBlueprint(Number(id)));
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(Number(id));
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (job.requirementItems.length === 0) {
    return NextResponse.json(
      { error: "Extract job requirements before generating a blueprint." },
      { status: 400 }
    );
  }

  const backgroundJob = await startBackgroundJob({
    kind: "job_blueprint",
    label: `Generating ideal CV blueprint — ${job.title || "Untitled role"}`,
    refTable: "job_descriptions",
    refId: job.id,
    task: async () => {
      const result = await generateIdealCvBlueprint(job.id, job.title, job.requirementItems);
      const blueprint = await createBlueprint({ jobDescriptionId: job.id, ...result });
      return { table: "blueprints", id: blueprint.id };
    },
  });

  return NextResponse.json(backgroundJob);
}
