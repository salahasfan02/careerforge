import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/server/collections/jobs";
import { getLatestSession, createSession } from "@/lib/server/collections/interviewSessions";
import { generateInterviewQuestions } from "@/lib/pipeline/interviewPrep";
import { startBackgroundJob } from "@/lib/server/backgroundRunner";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(getLatestSession(Number(id)));
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(Number(id));
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (job.requirementItems.length === 0) {
    return NextResponse.json({ error: "Extract job requirements first." }, { status: 400 });
  }

  const backgroundJob = await startBackgroundJob({
    kind: "interview_questions",
    label: `Generating interview questions — ${job.title || "Untitled role"}`,
    refTable: "job_descriptions",
    refId: job.id,
    task: async () => {
      const questions = await generateInterviewQuestions(job);
      const session = await createSession(
        job.id,
        questions.map((q, i) => ({ id: i + 1, question: q.question, category: q.category, starAnswer: null }))
      );
      return { table: "interview_sessions", id: session.id };
    },
  });

  return NextResponse.json(backgroundJob);
}
