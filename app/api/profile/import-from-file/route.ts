import { NextRequest, NextResponse } from "next/server";
import { extractText, UnsupportedFileTypeError } from "@/lib/parsing";
import { extractCareerProfileSuggestion } from "@/lib/pipeline/extractCareerProfileSuggestion";
import { createSuggestion } from "@/lib/server/collections/profileImportSuggestions";
import { startBackgroundJob } from "@/lib/server/backgroundRunner";

/**
 * Dedicated entry point for "upload a CV just to fill in my Career Profile" — unlike
 * /api/cvs (My CVs), this never creates a CV record and never runs ATS/structure analysis.
 * Its only output is a profile_import_suggestion for the user to review.
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  let extracted;
  try {
    extracted = await extractText(buffer, file.type, file.name);
  } catch (err) {
    if (err instanceof UnsupportedFileTypeError) {
      return NextResponse.json({ error: err.message }, { status: 415 });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  if (!extracted.text.trim()) {
    return NextResponse.json(
      { error: "Couldn't extract any text from that file — please try a different file or format." },
      { status: 400 }
    );
  }

  const backgroundJob = await startBackgroundJob({
    kind: "profile_import_suggestion",
    label: `Reading ${file.name} for profile suggestions`,
    task: async () => {
      const suggested = await extractCareerProfileSuggestion(null, extracted.text);
      const suggestion = await createSuggestion(null, suggested);
      return { table: "profile_import_suggestions", id: suggestion.id };
    },
  });

  return NextResponse.json(backgroundJob);
}
