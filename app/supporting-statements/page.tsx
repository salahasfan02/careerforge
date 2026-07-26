import { listJobs } from "@/lib/server/collections/jobs";
import { listGeneratedDocuments } from "@/lib/server/collections/generatedDocuments";
import { listActiveJobs } from "@/lib/server/collections/backgroundJobs";
import { DocumentGeneratorPanel } from "@/components/DocumentGeneratorPanel";
import { PendingJobsList } from "@/components/PendingJobsList";

export default function SupportingStatementsPage() {
  const jobs = listJobs().map((j) => ({ id: j.id, label: `${j.title || "Untitled"} — ${j.company || "Unknown"}` }));
  const documents = listGeneratedDocuments().filter((d) => d.type === "supporting_statement" || d.type === "personal_statement");
  const activeJobs = listActiveJobs("document_generate");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
          Supporting Statements
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
          For applications that ask for a supporting or personal statement rather than a cover letter.
        </p>
      </div>
      <PendingJobsList initialJobs={activeJobs} />
      <DocumentGeneratorPanel
        allowedTypes={["supporting_statement", "personal_statement"]}
        jobs={jobs}
        initialDocuments={documents}
      />
    </div>
  );
}
