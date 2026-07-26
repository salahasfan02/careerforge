import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { CvBuildContent, CvSectionType, CvTemplate } from "@/lib/server/types";
import { getTemplateStyle, SECTION_LABELS } from "@/lib/cvTemplates";

const SPACING_PT: Record<string, number> = { compact: 8, comfortable: 12, spacious: 18 };

function buildStyles(template: CvTemplate) {
  const t = getTemplateStyle(template);
  return StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: t.fontFamily === "serif" ? "Times-Roman" : "Helvetica",
      fontSize: 10,
      color: "#1a1a1a",
    },
    name: { fontSize: 20, fontWeight: 700, textAlign: "center" },
    contact: { fontSize: 9, textAlign: "center", color: "#444", marginTop: 2 },
    section: { marginBottom: SPACING_PT[t.spacing] },
    heading: {
      fontSize: 11,
      fontWeight: 700,
      color: t.accentColor,
      marginBottom: 4,
      textTransform: t.headingStyle === "uppercase" ? "uppercase" : "capitalize",
      borderBottom: t.dividerStyle === "line" ? `1pt solid ${t.accentColor}` : undefined,
      paddingBottom: t.dividerStyle === "line" ? 2 : 0,
    },
    row: { flexDirection: "row", justifyContent: "space-between" },
    jobTitle: { fontWeight: 700 },
    muted: { color: "#555" },
    bullet: { marginLeft: 10, marginBottom: 1 },
    entry: { marginBottom: 6 },
  });
}

function Section({
  type,
  content,
  styles,
}: {
  type: CvSectionType;
  content: CvBuildContent;
  styles: ReturnType<typeof buildStyles>;
}) {
  if (type === "summary" && content.summary) {
    return (
      <View style={styles.section}>
        <Text style={styles.heading}>{SECTION_LABELS.summary}</Text>
        <Text>{content.summary}</Text>
      </View>
    );
  }
  if (type === "skills" && content.skills.length > 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.heading}>{SECTION_LABELS.skills}</Text>
        <Text>{content.skills.join(" · ")}</Text>
      </View>
    );
  }
  if (type === "experience" && content.experience.length > 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.heading}>{SECTION_LABELS.experience}</Text>
        {content.experience.map((job, i) => (
          <View key={i} style={styles.entry}>
            <View style={styles.row}>
              <Text style={styles.jobTitle}>
                {job.jobTitle} — {job.company}
              </Text>
              <Text style={styles.muted}>
                {job.startDate} – {job.endDate || "Present"}
              </Text>
            </View>
            {job.bullets.map((b, j) => (
              <Text key={j} style={styles.bullet}>
                • {b.text}
              </Text>
            ))}
          </View>
        ))}
      </View>
    );
  }
  if (type === "projects" && content.projects.length > 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.heading}>{SECTION_LABELS.projects}</Text>
        {content.projects.map((p, i) => (
          <View key={i} style={styles.entry}>
            <Text style={styles.jobTitle}>{p.name}</Text>
            <Text>{p.description}</Text>
          </View>
        ))}
      </View>
    );
  }
  if (type === "education" && content.education.length > 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.heading}>{SECTION_LABELS.education}</Text>
        {content.education.map((e, i) => (
          <View key={i} style={styles.row}>
            <Text>
              {e.degree}
              {e.subject ? ` in ${e.subject}` : ""} — {e.institution}
            </Text>
            <Text style={styles.muted}>
              {e.startDate} – {e.endDate}
            </Text>
          </View>
        ))}
      </View>
    );
  }
  if (type === "certifications" && content.certifications.length > 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.heading}>{SECTION_LABELS.certifications}</Text>
        {content.certifications.map((c, i) => (
          <Text key={i}>
            {c.name} — {c.organisation} {c.date ? `(${c.date})` : ""}
          </Text>
        ))}
      </View>
    );
  }
  return null;
}

export function CvPdfDocument({ content, template }: { content: CvBuildContent; template: CvTemplate }) {
  const styles = buildStyles(template);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{content.personalInfo.name || "Your Name"}</Text>
        <Text style={styles.contact}>
          {[content.personalInfo.email, content.personalInfo.phone, content.personalInfo.location].filter(Boolean).join(" · ")}
        </Text>
        <Text style={styles.contact}>
          {[content.personalInfo.linkedin, content.personalInfo.github, content.personalInfo.portfolio, content.personalInfo.website]
            .filter(Boolean)
            .join(" · ")}
        </Text>
        <View style={{ marginTop: 12 }}>
          {content.sectionOrder.map((section) => (
            <Section key={section} type={section} content={content} styles={styles} />
          ))}
        </View>
      </Page>
    </Document>
  );
}
