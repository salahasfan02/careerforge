import { NextRequest, NextResponse } from "next/server";
import { listActiveJobs, listJobsForRef } from "@/lib/server/collections/backgroundJobs";
import type { BackgroundJobKind } from "@/lib/server/types";

export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get("kind") as BackgroundJobKind | null;
  const refTable = req.nextUrl.searchParams.get("refTable");
  const refId = req.nextUrl.searchParams.get("refId");

  if (refTable && refId) {
    return NextResponse.json(listJobsForRef(refTable, Number(refId), kind ?? undefined));
  }

  return NextResponse.json(listActiveJobs(kind ?? undefined));
}
