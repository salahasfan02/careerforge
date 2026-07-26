import { PDFParse } from "pdf-parse";
import type { ExtractResult } from "./types";

// Below this average characters-per-page, we treat the PDF as having no usable
// text layer (i.e. it's a scan) rather than silently handing near-empty text
// downstream to the AI pipeline.
const MIN_AVG_CHARS_PER_PAGE = 40;

export async function extractPdfText(buffer: Buffer): Promise<ExtractResult> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    const avgCharsPerPage = result.total > 0 ? result.text.length / result.total : 0;
    const hasTextLayer = result.total > 0 && avgCharsPerPage >= MIN_AVG_CHARS_PER_PAGE;

    const warnings: string[] = [];
    if (!hasTextLayer) {
      warnings.push(
        "This PDF doesn't appear to have a usable text layer (it looks like a scanned document). " +
          "Please re-upload it as an image (PNG/JPG) so it can be read with OCR instead."
      );
    }

    return { text: result.text, warnings, hasTextLayer };
  } finally {
    await parser.destroy();
  }
}
