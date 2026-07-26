import Link from "next/link";
import { listCvs } from "@/lib/server/collections/cvs";
import { CvUploadForm } from "@/components/CvUploadForm";
import { DeleteButton } from "@/components/DeleteButton";

export default function CvsPage() {
  const cvs = listCvs().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
          My CVs
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
          Upload a CV to check its writing quality, structure, and ATS compatibility — and optionally
          import its content into your Career Profile for review.
        </p>
      </div>

      <CvUploadForm />

      <div className="card p-5">
        <h2 className="font-semibold" style={{ color: "var(--ink)" }}>
          Uploaded CVs
        </h2>
        {cvs.length === 0 ? (
          <p className="mt-3 text-sm" style={{ color: "var(--ink-muted)" }}>
            None yet.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {cvs.map((cv) => (
              <li
                key={cv.id}
                className="flex items-center justify-between gap-2 rounded-lg p-1 pl-3"
                style={{ border: "1px solid var(--border)" }}
              >
                <Link href={`/cvs/${cv.id}`} className="flex flex-1 items-center justify-between py-2 text-sm">
                  <span style={{ color: "var(--ink)" }}>{cv.name}</span>
                  <span className="mr-2" style={{ color: "var(--ink-muted)" }}>
                    {cv.structureJson ? `ATS ${cv.structureJson.atsScore}/100` : "Not analysed"}
                  </span>
                </Link>
                <DeleteButton url={`/api/cvs/${cv.id}`} confirmMessage={`Delete "${cv.name}"? This can't be undone.`} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
