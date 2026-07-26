import mammoth from "mammoth";
import JSZip from "jszip";
import type { ExtractResult } from "./types";

export interface DocxStructuralSignals {
  tableCount: number;
  imageCount: number;
  textBoxCount: number;
  hasHeader: boolean;
  hasFooter: boolean;
}

export async function extractDocxText(buffer: Buffer): Promise<ExtractResult> {
  const result = await mammoth.extractRawText({ buffer });
  const warnings = result.messages
    .filter((m) => m.type === "warning" || m.type === "error")
    .map((m) => m.message);

  return {
    text: result.value,
    warnings,
    hasTextLayer: result.value.trim().length > 0,
  };
}

/**
 * Scans the raw DOCX XML (a docx is a zip of XML parts) for structural elements
 * that commonly break ATS text extraction — tables, embedded images, text boxes,
 * headers/footers. Used by atsAnalysis.ts; deliberately independent of mammoth's
 * text-conversion warnings, which don't capture all of these.
 */
export async function analyzeDocxStructure(buffer: Buffer): Promise<DocxStructuralSignals> {
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = (await zip.file("word/document.xml")?.async("string")) ?? "";

  const count = (pattern: RegExp) => (documentXml.match(pattern) ?? []).length;

  return {
    tableCount: count(/<w:tbl[ >]/g),
    imageCount: count(/<w:drawing[ >]|<pic:pic[ >]/g),
    textBoxCount: count(/<w:txbxContent[ >]/g),
    hasHeader: Object.keys(zip.files).some((name) => name.startsWith("word/header")),
    hasFooter: Object.keys(zip.files).some((name) => name.startsWith("word/footer")),
  };
}
