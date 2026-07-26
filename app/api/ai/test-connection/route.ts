import { NextResponse } from "next/server";
import { checkOllamaConnection } from "@/lib/ai/provider";

export async function GET() {
  const result = await checkOllamaConnection();
  return NextResponse.json(result);
}
