import type { AtsIssue, CvStructureAnalysis } from "../server/types";
import type { DocxStructuralSignals } from "../parsing/docx";

const SECTION_PATTERNS: Record<string, RegExp> = {
  Experience: /\b(experience|employment history|work history)\b/i,
  Education: /\beducation\b/i,
  Skills: /\bskills\b/i,
  Certifications: /\b(certifications?|licenses?)\b/i,
  Summary: /\b(summary|profile|objective)\b/i,
};

/**
 * Rule-based, deterministic structural/ATS analysis — no LLM involved. This is the
 * "can an ATS actually read this document" check: text-layer presence, detectable
 * sections, and formatting risks (tables/columns/images/text boxes/headers/footers)
 * that commonly break parsing in real applicant tracking systems.
 */
export function analyzeAts(params: {
  text: string;
  hasTextLayer: boolean;
  extractionWarnings: string[];
  docxSignals?: DocxStructuralSignals;
}): CvStructureAnalysis {
  const { text, hasTextLayer, extractionWarnings, docxSignals } = params;
  const issues: AtsIssue[] = [];
  const sectionsDetected: string[] = [];

  if (!hasTextLayer) {
    issues.push({
      severity: "risk",
      title: "No readable text layer",
      whatIsWorking: null,
      whatCouldCauseProblems:
        "This document has little to no extractable text, which usually means an ATS will see a blank or near-empty CV.",
      howToFix: "Re-export the CV from a Word processor as a native PDF/DOCX rather than a scanned image, or provide a text-based version.",
    });
  } else {
    issues.push({
      severity: "info",
      title: "Text extraction",
      whatIsWorking: "Your CV's text can be extracted cleanly, which is the baseline requirement for any ATS to read it.",
      whatCouldCauseProblems: null,
      howToFix: null,
    });
  }

  for (const [section, pattern] of Object.entries(SECTION_PATTERNS)) {
    if (pattern.test(text)) sectionsDetected.push(section);
  }
  const missingCore = ["Experience", "Education", "Skills"].filter((s) => !sectionsDetected.includes(s));
  if (missingCore.length > 0) {
    issues.push({
      severity: "warning",
      title: `Missing clear section headers: ${missingCore.join(", ")}`,
      whatIsWorking: null,
      whatCouldCauseProblems:
        "ATS systems and recruiters look for standard section headers to categorize your content. Without them, relevant content may be misfiled or skipped.",
      howToFix: `Add clear, standard section headings (e.g. "Experience", "Education", "Skills") rather than creative or merged headings.`,
    });
  } else {
    issues.push({
      severity: "info",
      title: "Standard sections detected",
      whatIsWorking: `Found clear section headers: ${sectionsDetected.join(", ")}.`,
      whatCouldCauseProblems: null,
      howToFix: null,
    });
  }

  if (docxSignals) {
    if (docxSignals.tableCount > 0) {
      issues.push({
        severity: "warning",
        title: `${docxSignals.tableCount} table(s) detected`,
        whatIsWorking: null,
        whatCouldCauseProblems:
          "Many ATS parsers read tables in the wrong order or skip their contents entirely, scrambling dates, titles, or skills.",
        howToFix: "Replace tables with plain paragraphs and bullet points, especially for your experience and skills sections.",
      });
    }
    if (docxSignals.textBoxCount > 0) {
      issues.push({
        severity: "risk",
        title: `${docxSignals.textBoxCount} text box(es) detected`,
        whatIsWorking: null,
        whatCouldCauseProblems: "Text inside text boxes is frequently invisible to ATS text extraction entirely.",
        howToFix: "Move any content in text boxes into the main document body as regular paragraphs.",
      });
    }
    if (docxSignals.imageCount > 0) {
      issues.push({
        severity: "warning",
        title: `${docxSignals.imageCount} image(s)/icon(s) detected`,
        whatIsWorking: null,
        whatCouldCauseProblems: "Text rendered as an image (including icons used next to contact details) is invisible to ATS text extraction.",
        howToFix: "Use plain text instead of icons or image-based graphics for contact details and section markers.",
      });
    }
    if (docxSignals.hasHeader || docxSignals.hasFooter) {
      issues.push({
        severity: "info",
        title: "Header/footer content detected",
        whatIsWorking: null,
        whatCouldCauseProblems: "Some ATS parsers ignore header/footer regions entirely, so content placed there (often contact info) may be dropped.",
        howToFix: "Keep essential information like your name and contact details in the main document body, not just the header/footer.",
      });
    }
  }

  for (const warning of extractionWarnings) {
    issues.push({
      severity: "warning",
      title: "Formatting note",
      whatIsWorking: null,
      whatCouldCauseProblems: warning,
      howToFix: "Simplify formatting in this area for more reliable parsing.",
    });
  }

  const riskCount = issues.filter((i) => i.severity === "risk").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const atsScore = Math.max(0, 100 - riskCount * 25 - warningCount * 10);
  const atsRisk: CvStructureAnalysis["atsRisk"] = atsScore >= 80 ? "low" : atsScore >= 55 ? "medium" : "high";

  return { atsScore, atsRisk, issues, sectionsDetected, hasTextLayer };
}
