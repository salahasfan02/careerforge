import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/server/collections/settings";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const settings = await saveSettings(body);
  return NextResponse.json(settings);
}
