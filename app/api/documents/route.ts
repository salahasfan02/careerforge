import { NextRequest, NextResponse } from "next/server";
import { createGeneratedDocument, listGeneratedDocuments } from "@/lib/server/collections/generatedDocuments";
import { getProfile } from "@/lib/server/collections/profile";
import { getJob } from "@/lib/server/collections/jobs";
import { getLatestMatch } from "@/lib/server/collections/matches";
import { generateDocument } from "@/lib/pipeline/generateDocument";
import { startBackgroundJob } from "@/lib/server/backgroundRunner";
import type { GeneratedDocumentType } from "@/lib/server/types";

export async function GET(req: NextRequest) {
  const jobDescriptionId = req.nextUrl.searchParams.get("jobId");
  return NextResponse.json(listGeneratedDocuments(jobDescriptionId ? Number(jobDescriptionId) : undefined));
}

const TYPE_LABEL: Record<GeneratedDocumentType, string> = {
  cover_letter: "cover letter",
  recruiter_message: "recruiter message",
  supporting_statement: "supporting statement",
  personal_statement: "personal statement",
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const type = body.type as GeneratedDocumentType;
  const maxWords = Number(body.maxWords) || 400;
  const style = body.style || "Professional";
  const useStarExamples = !!body.useStarExamples;
  const jobId = body.jobId ? Number(body.jobId) : undefined;

  const profile = getProfile();
  const job = jobId ? getJob(jobId) ?? undefined : undefined;
  const matchAnalysis = job ? getLatestMatch(job.id) : undefined;

  const backgroundJob = await startBackgroundJob({
    kind: "document_generate",
    label: `Drafting ${TYPE_LABEL[type]}${job ? ` — ${job.title || "Untitled role"}` : ""}`,
    refTable: job ? "job_descriptions" : undefined,
    refId: job?.id,
    task: async () => {
      const { content, wordCount } = await generateDocument({
        type,
        profile,
        job,
        matchAnalysis,
        maxWords,
        style,
        useStarExamples,
      });

      const doc = await createGeneratedDocument({
        type,
        jobDescriptionId: job?.id ?? null,
        content,
        wordCount,
        style,
        maxWords,
      });
      return { table: "generated_documents", id: doc.id };
    },
  });

  return NextResponse.json(backgroundJob);
}
