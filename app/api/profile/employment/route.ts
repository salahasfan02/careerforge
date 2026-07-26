import { NextRequest, NextResponse } from "next/server";
import { addEmployment } from "@/lib/server/collections/profile";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const profile = await addEmployment(body);
  return NextResponse.json(profile);
}
