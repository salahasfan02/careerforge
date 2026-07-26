import { getVisionProvider } from "../ai/provider";
import type { ExtractResult } from "./types";

const OCR_SYSTEM_PROMPT =
  "You transcribe text from an image of a CV/resume verbatim. Output only the transcribed " +
  "text, preserving line breaks and section order as best you can. Do not summarize, " +
  "comment, or add anything that isn't visible in the image.";

/**
 * OCR via a local vision model (llava/granite3.2-vision through Ollama). Local vision
 * OCR is meaningfully less reliable than the reasoning models on complex, multi-column
 * CV layouts — callers MUST show this text back to the user for confirmation before
 * using it for anything downstream (ATS analysis, profile-import suggestions).
 */
export async function extractImageText(buffer: Buffer): Promise<ExtractResult> {
  const provider = await getVisionProvider();
  if (!provider) {
    return {
      text: "",
      warnings: [
        "Local AI (Ollama) is not reachable, so this image couldn't be read. Start Ollama and try again.",
      ],
      hasTextLayer: false,
    };
  }

  const base64 = buffer.toString("base64");
  const text = await provider.complete(
    OCR_SYSTEM_PROMPT,
    "Transcribe all text visible in this CV image.",
    { images: [base64], temperature: 0 }
  );

  return {
    text,
    warnings: [
      "This text was extracted from an image using a local vision model — please review it for " +
        "accuracy before relying on it, since OCR can misread complex layouts.",
    ],
    hasTextLayer: text.trim().length > 0,
  };
}
