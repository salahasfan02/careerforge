import Link from "next/link";
import { listJobs } from "@/lib/server/collections/jobs";

export default function InterviewPrepPage() {
  const jobs = listJobs().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
          Interview Preparation
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
          Choose a job to generate likely questions, STAR answer drafts, and run a mock interview.
        </p>
      </div>

      {jobs.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
          Analyse a job first from Job Matches.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/interview-prep/${job.id}`}
                className="card flex items-center justify-between p-4 hover:bg-[var(--surface-2)]"
              >
                <span style={{ color: "var(--ink)" }}>
                  {job.title || "Untitled role"} — {job.company || "Unknown company"}
                </span>
                <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  {job.requirementItems.length} requirements
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
