import { NextRequest, NextResponse } from "next/server";
import { getCv, deleteCv } from "@/lib/server/collections/cvs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cv = getCv(Number(id));
  if (!cv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(cv);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteCv(Number(id));
  return NextResponse.json({ ok: true });
}
