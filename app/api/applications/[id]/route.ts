import { NextRequest, NextResponse } from "next/server";
import { getApplication, updateApplication, deleteApplication } from "@/lib/server/collections/applications";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = getApplication(Number(id));
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(app);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = await updateApplication(Number(id), body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteApplication(Number(id));
  return NextResponse.json({ ok: true });
}
