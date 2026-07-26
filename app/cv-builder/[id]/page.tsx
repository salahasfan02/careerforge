import { notFound } from "next/navigation";
import { getCvBuild } from "@/lib/server/collections/cvBuilds";
import { CvBuilderEditor } from "@/components/cv-builder/CvBuilderEditor";

export default async function CvBuilderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const build = getCvBuild(Number(id));
  if (!build) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
          {build.name}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
          {build.mode === "improve"
            ? "Grounded in your uploaded CV's own wording."
            : "Grounded in your Career Profile — bullets marked \"unverified\" were edited manually and aren't yet tied to a profile entry."}
        </p>
      </div>
      <CvBuilderEditor initialBuild={build} />
    </div>
  );
}
