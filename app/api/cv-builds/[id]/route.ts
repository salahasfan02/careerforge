import { NextRequest, NextResponse } from "next/server";
import { getCvBuild, updateCvBuild, deleteCvBuild } from "@/lib/server/collections/cvBuilds";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const build = getCvBuild(Number(id));
  if (!build) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(build);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = await updateCvBuild(Number(id), body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteCvBuild(Number(id));
  return NextResponse.json({ ok: true });
}
