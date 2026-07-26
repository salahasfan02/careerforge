import { NextRequest, NextResponse } from "next/server";
import { getSuggestion } from "@/lib/server/collections/profileImportSuggestions";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const suggestion = getSuggestion(Number(id));
  if (!suggestion) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(suggestion);
}
