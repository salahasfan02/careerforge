import type { CvBuildContent, CvSectionType, CvTemplate } from "@/lib/server/types";
import { getTemplateStyle, SECTION_LABELS } from "@/lib/cvTemplates";

const SPACING_PX: Record<string, number> = { compact: 10, comfortable: 16, spacious: 24 };

export function CvPreview({ content, template }: { content: CvBuildContent; template: CvTemplate }) {
  const style = getTemplateStyle(template);
  const gap = SPACING_PX[style.spacing];

  const headingCase = (label: string) => (style.headingStyle === "uppercase" ? label.toUpperCase() : label);

  return (
    <div
      className="mx-auto bg-white p-10 text-black shadow-sm"
      style={{
        fontFamily: style.fontFamily === "serif" ? "Georgia, 'Times New Roman', serif" : "Arial, Helvetica, sans-serif",
        width: "210mm",
        minHeight: "297mm",
        maxWidth: "100%",
      }}
    >
      <div className="text-center" style={{ marginBottom: gap }}>
        <h1 className="text-2xl font-bold">{content.personalInfo.name || "Your Name"}</h1>
        <p className="text-xs text-gray-600">
          {[content.personalInfo.email, content.personalInfo.phone, content.personalInfo.location]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="text-xs text-gray-600">
          {[content.personalInfo.linkedin, content.personalInfo.github, content.personalInfo.portfolio, content.personalInfo.website]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {content.sectionOrder.map((section) => (
        <Section key={section} type={section} content={content} accent={style.accentColor} divider={style.dividerStyle} heading={headingCase} gap={gap} />
      ))}
    </div>
  );
}

function Section({
  type,
  content,
  accent,
  divider,
  heading,
  gap,
}: {
  type: CvSectionType;
  content: CvBuildContent;
  accent: string;
  divider: "line" | "none";
  heading: (label: string) => string;
  gap: number;
}) {
  const titleStyle = { color: accent, marginBottom: 6, fontWeight: 700, fontSize: 13 } as const;
  const dividerStyle = divider === "line" ? { borderBottom: `1px solid ${accent}`, paddingBottom: 4 } : {};

  if (type === "summary" && content.summary) {
    return (
      <div style={{ marginBottom: gap }}>
        <p style={{ ...titleStyle, ...dividerStyle }}>{heading(SECTION_LABELS.summary)}</p>
        <p className="text-sm leading-relaxed">{content.summary}</p>
      </div>
    );
  }

  if (type === "skills" && content.skills.length > 0) {
    return (
      <div style={{ marginBottom: gap }}>
        <p style={{ ...titleStyle, ...dividerStyle }}>{heading(SECTION_LABELS.skills)}</p>
        <p className="text-sm">{content.skills.join(" · ")}</p>
      </div>
    );
  }

  if (type === "experience" && content.experience.length > 0) {
    return (
      <div style={{ marginBottom: gap }}>
        <p style={{ ...titleStyle, ...dividerStyle }}>{heading(SECTION_LABELS.experience)}</p>
        {content.experience.map((job, i) => (
          <div key={i} className="mb-3">
            <div className="flex items-baseline justify-between text-sm">
              <strong>
                {job.jobTitle} — {job.company}
              </strong>
              <span className="text-xs text-gray-600">
                {job.startDate} – {job.endDate || "Present"}
              </span>
            </div>
            {job.location && <p className="text-xs text-gray-600">{job.location}</p>}
            <ul className="mt-1 list-disc pl-5 text-sm">
              {job.bullets.map((b, j) => (
                <li key={j}>{b.text}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  if (type === "projects" && content.projects.length > 0) {
    return (
      <div style={{ marginBottom: gap }}>
        <p style={{ ...titleStyle, ...dividerStyle }}>{heading(SECTION_LABELS.projects)}</p>
        {content.projects.map((p, i) => (
          <div key={i} className="mb-2 text-sm">
            <strong>{p.name}</strong> {p.technologies && <span className="text-xs text-gray-600">({p.technologies})</span>}
            <p>{p.description}</p>
          </div>
        ))}
      </div>
    );
  }

  if (type === "education" && content.education.length > 0) {
    return (
      <div style={{ marginBottom: gap }}>
        <p style={{ ...titleStyle, ...dividerStyle }}>{heading(SECTION_LABELS.education)}</p>
        {content.education.map((e, i) => (
          <div key={i} className="mb-1 flex items-baseline justify-between text-sm">
            <span>
              <strong>
                {e.degree}
                {e.subject ? ` in ${e.subject}` : ""}
              </strong>{" "}
              — {e.institution} {e.grade ? `(${e.grade})` : ""}
            </span>
            <span className="text-xs text-gray-600">
              {e.startDate} – {e.endDate}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (type === "certifications" && content.certifications.length > 0) {
    return (
      <div style={{ marginBottom: gap }}>
        <p style={{ ...titleStyle, ...dividerStyle }}>{heading(SECTION_LABELS.certifications)}</p>
        {content.certifications.map((c, i) => (
          <p key={i} className="text-sm">
            {c.name} — {c.organisation} {c.date ? `(${c.date})` : ""}
          </p>
        ))}
      </div>
    );
  }

  return null;
}
