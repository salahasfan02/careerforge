import { NextRequest, NextResponse } from "next/server";
import { getCvBuild } from "@/lib/server/collections/cvBuilds";
import { buildCvDocx } from "@/lib/pdf/cvDocxDocument";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const build = getCvBuild(Number(id));
  if (!build) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await buildCvDocx(build.content, build.template);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${build.name.replace(/[^\w\- ]/g, "")}.docx"`,
    },
  });
}
