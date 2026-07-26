import { NextRequest, NextResponse } from "next/server";
import { addProject } from "@/lib/server/collections/profile";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const profile = await addProject(body);
  return NextResponse.json(profile);
}
