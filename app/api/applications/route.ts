import { NextRequest, NextResponse } from "next/server";
import { createApplication, listApplications } from "@/lib/server/collections/applications";

export async function GET() {
  return NextResponse.json(listApplications());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const application = await createApplication({
    company: body.company || "",
    jobTitle: body.jobTitle || "",
    jobDescriptionId: body.jobDescriptionId ?? null,
    dateApplied: body.dateApplied ?? null,
    cvBuildId: body.cvBuildId ?? null,
    coverLetterId: body.coverLetterId ?? null,
    status: body.status || "interested",
    interviewDate: body.interviewDate ?? null,
    notes: body.notes || "",
  });
  return NextResponse.json(application);
}
