import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import type { CvBuildContent, CvSectionType, CvTemplate } from "@/lib/server/types";
import { getTemplateStyle, SECTION_LABELS } from "@/lib/cvTemplates";

function sectionHeading(text: string, template: CvTemplate): Paragraph {
  const style = getTemplateStyle(template);
  const label = style.headingStyle === "uppercase" ? text.toUpperCase() : text;
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 100 },
    border: style.dividerStyle === "line" ? { bottom: { style: "single", size: 4, color: style.accentColor.replace("#", "") } } : undefined,
    children: [new TextRun({ text: label, bold: true, color: style.accentColor.replace("#", "") })],
  });
}

function sectionParagraphs(type: CvSectionType, content: CvBuildContent, template: CvTemplate): Paragraph[] {
  const paras: Paragraph[] = [];

  if (type === "summary" && content.summary) {
    paras.push(sectionHeading(SECTION_LABELS.summary, template));
    paras.push(new Paragraph({ children: [new TextRun(content.summary)] }));
  }

  if (type === "skills" && content.skills.length > 0) {
    paras.push(sectionHeading(SECTION_LABELS.skills, template));
    paras.push(new Paragraph({ children: [new TextRun(content.skills.join(" · "))] }));
  }

  if (type === "experience" && content.experience.length > 0) {
    paras.push(sectionHeading(SECTION_LABELS.experience, template));
    for (const job of content.experience) {
      paras.push(
        new Paragraph({
          spacing: { before: 100 },
          children: [
            new TextRun({ text: `${job.jobTitle} — ${job.company}`, bold: true }),
            new TextRun({ text: `\t${job.startDate} – ${job.endDate || "Present"}`, italics: true }),
          ],
        })
      );
      for (const bullet of job.bullets) {
        paras.push(new Paragraph({ text: bullet.text, bullet: { level: 0 } }));
      }
    }
  }

  if (type === "projects" && content.projects.length > 0) {
    paras.push(sectionHeading(SECTION_LABELS.projects, template));
    for (const p of content.projects) {
      paras.push(new Paragraph({ children: [new TextRun({ text: p.name, bold: true })] }));
      paras.push(new Paragraph({ text: p.description }));
    }
  }

  if (type === "education" && content.education.length > 0) {
    paras.push(sectionHeading(SECTION_LABELS.education, template));
    for (const e of content.education) {
      paras.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${e.degree}${e.subject ? ` in ${e.subject}` : ""} — ${e.institution}` }),
            new TextRun({ text: `\t${e.startDate} – ${e.endDate}`, italics: true }),
          ],
        })
      );
    }
  }

  if (type === "certifications" && content.certifications.length > 0) {
    paras.push(sectionHeading(SECTION_LABELS.certifications, template));
    for (const c of content.certifications) {
      paras.push(new Paragraph({ text: `${c.name} — ${c.organisation}${c.date ? ` (${c.date})` : ""}` }));
    }
  }

  return paras;
}

export async function buildCvDocx(content: CvBuildContent, template: CvTemplate): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: content.personalInfo.name || "Your Name", bold: true, size: 32 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: [content.personalInfo.email, content.personalInfo.phone, content.personalInfo.location].filter(Boolean).join(" · "),
                size: 18,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: [content.personalInfo.linkedin, content.personalInfo.github, content.personalInfo.portfolio, content.personalInfo.website]
                  .filter(Boolean)
                  .join(" · "),
                size: 18,
              }),
            ],
          }),
          ...content.sectionOrder.flatMap((section) => sectionParagraphs(section, content, template)),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
