import { extractPdfText } from "./pdf";
import { extractDocxText } from "./docx";
import { extractImageText } from "./image";
import { extractPlainText } from "./text";
import type { ExtractResult } from "./types";

export type { ExtractResult } from "./types";

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const DOCX_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export class UnsupportedFileTypeError extends Error {
  constructor(mimeType: string) {
    super(
      `Unsupported file type "${mimeType}". Please upload a PDF, DOCX, TXT, or an image (PNG/JPG).`
    );
    this.name = "UnsupportedFileTypeError";
  }
}

export async function extractText(buffer: Buffer, mimeType: string, fileName: string): Promise<ExtractResult> {
  if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
    return extractPdfText(buffer);
  }
  if (DOCX_TYPES.has(mimeType) || fileName.toLowerCase().endsWith(".docx")) {
    return extractDocxText(buffer);
  }
  if (IMAGE_TYPES.has(mimeType) || /\.(png|jpe?g|webp)$/i.test(fileName)) {
    return extractImageText(buffer);
  }
  if (mimeType === "text/plain" || fileName.toLowerCase().endsWith(".txt")) {
    return extractPlainText(buffer);
  }
  throw new UnsupportedFileTypeError(mimeType || "unknown");
}
