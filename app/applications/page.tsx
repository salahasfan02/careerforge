import { listApplications } from "@/lib/server/collections/applications";
import { listJobs } from "@/lib/server/collections/jobs";
import { listCvBuilds } from "@/lib/server/collections/cvBuilds";
import { listGeneratedDocuments } from "@/lib/server/collections/generatedDocuments";
import { ApplicationTracker } from "@/components/ApplicationTracker";

export default function ApplicationsPage() {
  const applications = listApplications();
  const jobs = listJobs().map((j) => ({ id: j.id, label: `${j.title || "Untitled"} — ${j.company || "Unknown"}` }));
  const cvBuilds = listCvBuilds().map((c) => ({ id: c.id, label: c.name }));
  const coverLetters = listGeneratedDocuments()
    .filter((d) => d.type === "cover_letter")
    .map((d) => ({ id: d.id, label: `${d.type} · ${new Date(d.createdAt).toLocaleDateString()}` }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
          Application Tracker
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
          Track every application, which CV version and cover letter you used, and where things stand.
        </p>
      </div>
      <ApplicationTracker initialApplications={applications} jobs={jobs} cvBuilds={cvBuilds} coverLetters={coverLetters} />
    </div>
  );
}
