import { notFound } from "next/navigation";
import { getJob } from "@/lib/server/collections/jobs";
import { getLatestSession } from "@/lib/server/collections/interviewSessions";
import { listJobsForRef } from "@/lib/server/collections/backgroundJobs";
import { InterviewPrepPanel } from "@/components/InterviewPrepPanel";

export default async function InterviewPrepJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(Number(id));
  if (!job) notFound();

  const session = getLatestSession(job.id);
  const activeQuestionsJob =
    listJobsForRef("job_descriptions", job.id, "interview_questions").find((j) => j.status === "running") ?? null;
  const activeSessionJob = session
    ? listJobsForRef("interview_sessions", session.id).find((j) => j.status === "running") ?? null
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
          Interview Prep: {job.title || "Untitled role"}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
          {job.company}
        </p>
      </div>
      <InterviewPrepPanel
        jobId={job.id}
        initialSession={session}
        initialActiveQuestionsJob={activeQuestionsJob}
        initialActiveSessionJob={activeSessionJob}
      />
    </div>
  );
}
