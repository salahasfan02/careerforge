import { NextRequest, NextResponse } from "next/server";
import { updateEducation, deleteEducation } from "@/lib/server/collections/profile";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const profile = await updateEducation(Number(id), body);
  return NextResponse.json(profile);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await deleteEducation(Number(id));
  return NextResponse.json(profile);
}
