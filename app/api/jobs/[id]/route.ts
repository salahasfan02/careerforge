import { NextRequest, NextResponse } from "next/server";
import { getJob, deleteJob } from "@/lib/server/collections/jobs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(Number(id));
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(job);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteJob(Number(id));
  return NextResponse.json({ ok: true });
}
