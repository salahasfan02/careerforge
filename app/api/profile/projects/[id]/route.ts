import { NextRequest, NextResponse } from "next/server";
import { updateProject, deleteProject } from "@/lib/server/collections/profile";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const profile = await updateProject(Number(id), body);
  return NextResponse.json(profile);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await deleteProject(Number(id));
  return NextResponse.json(profile);
}
