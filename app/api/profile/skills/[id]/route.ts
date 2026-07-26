import { NextRequest, NextResponse } from "next/server";
import { updateSkill, deleteSkill } from "@/lib/server/collections/profile";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const profile = await updateSkill(Number(id), body);
  return NextResponse.json(profile);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await deleteSkill(Number(id));
  return NextResponse.json(profile);
}
