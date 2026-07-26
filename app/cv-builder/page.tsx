import Link from "next/link";
import { listCvBuilds } from "@/lib/server/collections/cvBuilds";
import { listCvs } from "@/lib/server/collections/cvs";
import { listJobs } from "@/lib/server/collections/jobs";
import { listActiveJobs } from "@/lib/server/collections/backgroundJobs";
import { NewCvBuildForm } from "@/components/cv-builder/NewCvBuildForm";
import { PendingJobsList } from "@/components/PendingJobsList";
import { DeleteButton } from "@/components/DeleteButton";

export default function CvBuilderPage() {
  const builds = listCvBuilds();
  const cvs = listCvs().map((c) => ({ id: c.id, label: c.name }));
  const jobs = listJobs().map((j) => ({ id: j.id, label: `${j.title || "Untitled"} — ${j.company || "Unknown"}` }));
  const activeJobs = listActiveJobs("cv_build_generate");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
          CV Builder
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
          Generate a CV grounded in your verified Career Profile, edit it, and export as PDF or DOCX.
        </p>
      </div>

      <PendingJobsList initialJobs={activeJobs} />
      <NewCvBuildForm cvs={cvs} jobs={jobs} />

      <div className="card p-5">
        <h2 className="font-semibold" style={{ color: "var(--ink)" }}>
          Your CVs
        </h2>
        {builds.length === 0 ? (
          <p className="mt-3 text-sm" style={{ color: "var(--ink-muted)" }}>
            None yet.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {builds.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-2 rounded-lg p-1 pl-3"
                style={{ border: "1px solid var(--border)" }}
              >
                <Link href={`/cv-builder/${b.id}`} className="flex flex-1 items-center justify-between py-2 text-sm">
                  <span style={{ color: "var(--ink)" }}>{b.name}</span>
                  <span className="mr-2" style={{ color: "var(--ink-muted)" }}>
                    {b.template}
                  </span>
                </Link>
                <DeleteButton url={`/api/cv-builds/${b.id}`} confirmMessage={`Delete "${b.name}"? This can't be undone.`} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
