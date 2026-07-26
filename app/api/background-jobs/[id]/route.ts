import { NextRequest, NextResponse } from "next/server";
import { getBackgroundJob } from "@/lib/server/collections/backgroundJobs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getBackgroundJob(Number(id));
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(job);
}
