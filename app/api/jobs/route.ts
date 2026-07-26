import { NextRequest, NextResponse } from "next/server";
import { createJob, listJobs } from "@/lib/server/collections/jobs";
import { extractText, UnsupportedFileTypeError } from "@/lib/parsing";

export async function GET() {
  return NextResponse.json(listJobs());
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      const extracted = await extractText(buffer, file.type, file.name);
      const job = await createJob({
        title: (formData.get("title") as string) || file.name,
        company: (formData.get("company") as string) || "",
        rawText: extracted.text,
        sourceType: /\.(png|jpe?g|webp)$/i.test(file.name) ? "image" : "upload",
      });
      return NextResponse.json(job);
    } catch (err) {
      if (err instanceof UnsupportedFileTypeError) {
        return NextResponse.json({ error: err.message }, { status: 415 });
      }
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
  }

  const body = await req.json();
  if (!body.rawText?.trim()) {
    return NextResponse.json({ error: "Job description text is required" }, { status: 400 });
  }
  const job = await createJob({
    title: body.title || "",
    company: body.company || "",
    rawText: body.rawText,
    sourceType: "paste",
  });
  return NextResponse.json(job);
}
