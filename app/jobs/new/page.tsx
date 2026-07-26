import { JobInputForm } from "@/components/JobInputForm";

export default function NewJobPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
          Analyse a job description
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
          Paste text, upload a file, or upload a screenshot of the listing.
        </p>
      </div>
      <JobInputForm />
    </div>
  );
}
