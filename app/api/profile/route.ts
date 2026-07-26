import { NextRequest, NextResponse } from "next/server";
import { getProfile, savePersonalInfo } from "@/lib/server/collections/profile";

export async function GET() {
  return NextResponse.json(getProfile());
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const profile = await savePersonalInfo(body);
  return NextResponse.json(profile);
}
