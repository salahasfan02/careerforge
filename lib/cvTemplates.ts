import type { CvSectionType, CvTemplate } from "./server/types";

export interface CvTemplateStyle {
  id: CvTemplate;
  label: string;
  description: string;
  fontFamily: "serif" | "sans";
  headingStyle: "uppercase" | "titlecase";
  accentColor: string;
  dividerStyle: "line" | "none";
  spacing: "compact" | "comfortable" | "spacious";
  defaultSectionOrder: CvSectionType[];
}

// All templates are deliberately single-column with no tables, text boxes, or icons —
// ATS-safety is a structural property of the builder, not a per-template opt-in. The six
// templates differ in typography/spacing/emphasis, not layout risk.
export const CV_TEMPLATES: CvTemplateStyle[] = [
  {
    id: "traditional",
    label: "Traditional Professional",
    description: "Classic serif layout — safe, neutral, works for almost any industry.",
    fontFamily: "serif",
    headingStyle: "uppercase",
    accentColor: "#1f2937",
    dividerStyle: "line",
    spacing: "comfortable",
    defaultSectionOrder: ["summary", "skills", "experience", "education", "projects", "certifications"],
  },
  {
    id: "modern",
    label: "Modern Professional",
    description: "Clean sans-serif with a subtle accent color.",
    fontFamily: "sans",
    headingStyle: "titlecase",
    accentColor: "#0d6e6e",
    dividerStyle: "line",
    spacing: "comfortable",
    defaultSectionOrder: ["summary", "skills", "experience", "projects", "education", "certifications"],
  },
  {
    id: "technical",
    label: "Technical",
    description: "Compact and skills-forward — suited to engineering and technical roles.",
    fontFamily: "sans",
    headingStyle: "uppercase",
    accentColor: "#334155",
    dividerStyle: "none",
    spacing: "compact",
    defaultSectionOrder: ["summary", "skills", "experience", "projects", "education", "certifications"],
  },
  {
    id: "academic",
    label: "Academic",
    description: "Emphasizes education and credentials, generous spacing for detail.",
    fontFamily: "serif",
    headingStyle: "titlecase",
    accentColor: "#1f2937",
    dividerStyle: "line",
    spacing: "spacious",
    defaultSectionOrder: ["summary", "education", "certifications", "experience", "projects", "skills"],
  },
  {
    id: "graduate",
    label: "Graduate",
    description: "Leads with education and projects — built for early-career candidates.",
    fontFamily: "sans",
    headingStyle: "titlecase",
    accentColor: "#0d6e6e",
    dividerStyle: "line",
    spacing: "comfortable",
    defaultSectionOrder: ["summary", "education", "projects", "skills", "experience", "certifications"],
  },
  {
    id: "executive",
    label: "Executive",
    description: "Understated, senior-level tone with generous white space.",
    fontFamily: "serif",
    headingStyle: "uppercase",
    accentColor: "#111827",
    dividerStyle: "none",
    spacing: "spacious",
    defaultSectionOrder: ["summary", "experience", "skills", "education", "projects", "certifications"],
  },
];

export function getTemplateStyle(id: CvTemplate): CvTemplateStyle {
  return CV_TEMPLATES.find((t) => t.id === id) ?? CV_TEMPLATES[0];
}

export const SECTION_LABELS: Record<CvSectionType, string> = {
  summary: "Professional Summary",
  skills: "Core Skills",
  experience: "Professional Experience",
  projects: "Key Projects",
  education: "Education",
  certifications: "Certifications",
};
