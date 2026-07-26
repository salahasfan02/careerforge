import { listJobs } from "@/lib/server/collections/jobs";
import { listGeneratedDocuments } from "@/lib/server/collections/generatedDocuments";
import { listActiveJobs } from "@/lib/server/collections/backgroundJobs";
import { DocumentGeneratorPanel } from "@/components/DocumentGeneratorPanel";
import { PendingJobsList } from "@/components/PendingJobsList";

export default function CoverLettersPage() {
  const jobs = listJobs().map((j) => ({ id: j.id, label: `${j.title || "Untitled"} — ${j.company || "Unknown"}` }));
  const documents = listGeneratedDocuments().filter((d) => d.type === "cover_letter" || d.type === "recruiter_message");
  const activeJobs = listActiveJobs("document_generate");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
          Cover Letters
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
          Generated from your verified Career Profile — always review before sending.
        </p>
      </div>
      <PendingJobsList initialJobs={activeJobs} />
      <DocumentGeneratorPanel allowedTypes={["cover_letter", "recruiter_message"]} jobs={jobs} initialDocuments={documents} />
    </div>
  );
}
