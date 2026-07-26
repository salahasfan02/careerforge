import { NextRequest, NextResponse } from "next/server";
import { addSkill } from "@/lib/server/collections/profile";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const profile = await addSkill(body);
  return NextResponse.json(profile);
}
