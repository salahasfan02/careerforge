import { NextRequest, NextResponse } from "next/server";
import { addHighlight } from "@/lib/server/collections/profile";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const profile = await addHighlight(Number(id), body);
  return NextResponse.json(profile);
}
