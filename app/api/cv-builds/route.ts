import { NextRequest, NextResponse } from "next/server";
import { createCvBuild, listCvBuilds } from "@/lib/server/collections/cvBuilds";
import { getProfile } from "@/lib/server/collections/profile";
import { getJob } from "@/lib/server/collections/jobs";
import { getCv } from "@/lib/server/collections/cvs";
import { getLatestMatch } from "@/lib/server/collections/matches";
import { generateCvContent } from "@/lib/pipeline/generateCv";
import { getTemplateStyle } from "@/lib/cvTemplates";
import { startBackgroundJob } from "@/lib/server/backgroundRunner";
import type { CvGenerationMode, CvTemplate } from "@/lib/server/types";

export async function GET() {
  return NextResponse.json(listCvBuilds());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const mode = body.mode as CvGenerationMode;
  const template = (body.template as CvTemplate) || "modern";

  if (mode === "tailor" && !body.jobId) {
    return NextResponse.json({ error: "Mode 2 requires a jobId." }, { status: 400 });
  }
  if (mode === "improve" && !body.sourceCvId) {
    return NextResponse.json({ error: "Mode 1 requires a sourceCvId." }, { status: 400 });
  }

  const profile = getProfile();
  const job = body.jobId ? getJob(Number(body.jobId)) : undefined;
  const sourceCv = body.sourceCvId ? getCv(Number(body.sourceCvId)) ?? undefined : undefined;
  const matchAnalysis = job ? getLatestMatch(job.id) : undefined;

  const backgroundJob = await startBackgroundJob({
    kind: "cv_build_generate",
    label: `Generating CV — ${job ? job.title || "Untitled role" : "from your profile"}`,
    task: async () => {
      const content = await generateCvContent({ mode, profile, job: job ?? undefined, matchAnalysis, sourceCv });
      content.sectionOrder = getTemplateStyle(template).defaultSectionOrder;

      const build = await createCvBuild({
        name:
          body.name ||
          (job ? `${job.title || "Untitled role"} — ${new Date().toLocaleDateString()}` : `CV — ${new Date().toLocaleDateString()}`),
        template,
        mode,
        sourceCvId: sourceCv?.id ?? null,
        jobDescriptionId: job?.id ?? null,
        content,
      });
      return { table: "cv_builds", id: build.id };
    },
  });

  return NextResponse.json(backgroundJob);
}
