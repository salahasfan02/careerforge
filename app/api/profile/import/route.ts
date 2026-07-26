import { NextRequest, NextResponse } from "next/server";
import { getCv } from "@/lib/server/collections/cvs";
import { createSuggestion, listSuggestions } from "@/lib/server/collections/profileImportSuggestions";
import { extractCareerProfileSuggestion } from "@/lib/pipeline/extractCareerProfileSuggestion";
import { startBackgroundJob } from "@/lib/server/backgroundRunner";

export async function GET() {
  return NextResponse.json(listSuggestions());
}

export async function POST(req: NextRequest) {
  const { cvId } = await req.json();
  const cv = getCv(Number(cvId));
  if (!cv) return NextResponse.json({ error: "CV not found" }, { status: 404 });
  if (!cv.rawText.trim()) {
    return NextResponse.json({ error: "This CV has no extracted text to import from." }, { status: 400 });
  }

  const backgroundJob = await startBackgroundJob({
    kind: "profile_import_suggestion",
    label: `Reading ${cv.name} for profile suggestions`,
    refTable: "cvs",
    refId: cv.id,
    task: async () => {
      const suggested = await extractCareerProfileSuggestion(cv.id, cv.rawText);
      const suggestion = await createSuggestion(cv.id, suggested);
      return { table: "profile_import_suggestions", id: suggestion.id };
    },
  });

  return NextResponse.json(backgroundJob);
}
