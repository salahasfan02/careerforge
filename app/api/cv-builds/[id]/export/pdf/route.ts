import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getCvBuild } from "@/lib/server/collections/cvBuilds";
import { CvPdfDocument } from "@/lib/pdf/CvPdfDocument";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const build = getCvBuild(Number(id));
  if (!build) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await renderToBuffer(CvPdfDocument({ content: build.content, template: build.template }));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${build.name.replace(/[^\w\- ]/g, "")}.pdf"`,
    },
  });
}
