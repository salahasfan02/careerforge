import { NextRequest, NextResponse } from "next/server";
import { updateCertification, deleteCertification } from "@/lib/server/collections/profile";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const profile = await updateCertification(Number(id), body);
  return NextResponse.json(profile);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await deleteCertification(Number(id));
  return NextResponse.json(profile);
}
