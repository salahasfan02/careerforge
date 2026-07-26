import { NextRequest, NextResponse } from "next/server";
import { addSkillEvidence } from "@/lib/server/collections/profile";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const profile = await addSkillEvidence(Number(id), body);
  return NextResponse.json(profile);
}
