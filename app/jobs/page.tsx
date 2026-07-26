import Link from "next/link";
import { listJobs } from "@/lib/server/collections/jobs";
import { DeleteButton } from "@/components/DeleteButton";

export default function JobsPage() {
  const jobs = listJobs().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
            Job Matches
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
            Analyse a job description to see how it compares against your Career Profile.
          </p>
        </div>
        <Link href="/jobs/new" className="rounded-md px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--accent)" }}>
          + New job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
          No jobs analysed yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {jobs.map((job) => (
            <li key={job.id} className="card flex items-center justify-between gap-2 p-2 pl-4">
              <Link href={`/jobs/${job.id}`} className="flex flex-1 items-center justify-between py-2">
                <div>
                  <p className="font-medium" style={{ color: "var(--ink)" }}>
                    {job.title || "Untitled role"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                    {job.company || "Unknown company"} · {job.requirementItems.length} requirements extracted
                  </p>
                </div>
                <span className="mr-2 text-xs" style={{ color: "var(--ink-muted)" }}>
                  {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </Link>
              <DeleteButton
                url={`/api/jobs/${job.id}`}
                confirmMessage={`Delete "${job.title || "this job"}"? This can't be undone.`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
