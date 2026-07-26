import { NextRequest, NextResponse } from "next/server";
import { getGeneratedDocument, deleteGeneratedDocument } from "@/lib/server/collections/generatedDocuments";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = getGeneratedDocument(Number(id));
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteGeneratedDocument(Number(id));
  return NextResponse.json({ ok: true });
}
