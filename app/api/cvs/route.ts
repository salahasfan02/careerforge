import { NextRequest, NextResponse } from "next/server";
import { createCv, listCvs } from "@/lib/server/collections/cvs";
import { setCvStructureAnalysis } from "@/lib/server/collections/cvs";
import { extractText, UnsupportedFileTypeError } from "@/lib/parsing";
import { analyzeDocxStructure } from "@/lib/parsing/docx";
import { analyzeAts } from "@/lib/pipeline/atsAnalysis";

export async function GET() {
  return NextResponse.json(listCvs());
}

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

  const cv = await createCv({
    name: (formData.get("name") as string) || file.name,
    fileName: file.name,
    mimeType: file.type,
    rawText: extracted.text,
    extractionWarnings: extracted.warnings,
    structureJson: null,
  });

  const isDocx = file.name.toLowerCase().endsWith(".docx");
  const docxSignals = isDocx ? await analyzeDocxStructure(buffer) : undefined;

  const analysis = analyzeAts({
    text: extracted.text,
    hasTextLayer: extracted.hasTextLayer,
    extractionWarnings: extracted.warnings,
    docxSignals,
  });
  await setCvStructureAnalysis(cv.id, analysis);

  return NextResponse.json({ ...cv, structureJson: analysis });
}
