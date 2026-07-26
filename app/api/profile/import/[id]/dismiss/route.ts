import { NextRequest, NextResponse } from "next/server";
import { resolveSuggestion } from "@/lib/server/collections/profileImportSuggestions";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await resolveSuggestion(Number(id), "dismissed", null);
  return NextResponse.json({ ok: true });
}
