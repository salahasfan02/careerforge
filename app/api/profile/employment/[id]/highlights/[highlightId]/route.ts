import { NextRequest, NextResponse } from "next/server";
import { updateHighlight, deleteHighlight } from "@/lib/server/collections/profile";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; highlightId: string }> }
) {
  const { id, highlightId } = await params;
  const body = await req.json();
  const profile = await updateHighlight(Number(id), Number(highlightId), body);
  return NextResponse.json(profile);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; highlightId: string }> }
) {
  const { id, highlightId } = await params;
  const profile = await deleteHighlight(Number(id), Number(highlightId));
  return NextResponse.json(profile);
}
