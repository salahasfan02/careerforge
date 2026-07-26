import { NextRequest, NextResponse } from "next/server";
import { addCertification } from "@/lib/server/collections/profile";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const profile = await addCertification(body);
  return NextResponse.json(profile);
}
