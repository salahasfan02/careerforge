import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/server/collections/jobs";
import { getProfile } from "@/lib/server/collections/profile";
import { getLatestMatch } from "@/lib/server/collections/matches";
import { runMatch } from "@/lib/pipeline/matchEngine";
import { startBackgroundJob } from "@/lib/server/backgroundRunner";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = getLatestMatch(Number(id));
  return NextResponse.json(match);
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(Number(id));
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (job.requirementItems.length === 0) {
    return NextResponse.json(
      { error: "Extract job requirements before running a match." },
      { status: 400 }
    );
  }

  const profile = getProfile();
  const backgroundJob = await startBackgroundJob({
    kind: "job_match",
    label: `Matching your profile — ${job.title || "Untitled role"}`,
    refTable: "job_descriptions",
    refId: job.id,
    task: async () => {
      const match = await runMatch(profile, job);
      return { table: "matches", id: match.id };
    },
  });

  return NextResponse.json(backgroundJob);
}
