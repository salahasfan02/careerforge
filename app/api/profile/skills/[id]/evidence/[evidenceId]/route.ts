import { NextRequest, NextResponse } from "next/server";
import { deleteSkillEvidence } from "@/lib/server/collections/profile";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; evidenceId: string }> }
) {
  const { id, evidenceId } = await params;
  const profile = await deleteSkillEvidence(Number(id), Number(evidenceId));
  return NextResponse.json(profile);
}
