import { getProfile } from "./collections/profile";
import type { ProfileEntryRef } from "./types";

export type { ProfileEntryRef } from "./types";

export interface ResolvedProfileEntry {
  text: string;
  /** Human-readable breadcrumb, e.g. "Employment → Acme Corp → Highlight #3" */
  path: string;
}

/**
 * The single place that turns a stored evidence citation back into readable text.
 * Every generated claim in the product must be traceable through this function —
 * Phase 2 (tailored CV generation, cover letters) reuses it rather than inventing
 * a second way to reference profile content.
 */
export function resolveProfileEntry(ref: ProfileEntryRef): ResolvedProfileEntry | null {
  const profile = getProfile();

  switch (ref.table) {
    case "skills": {
      const skill = profile.skills.find((s) => s.id === ref.id);
      if (!skill) return null;
      return { text: skill.name, path: `Skills → ${skill.name}` };
    }
    case "skill_evidence": {
      for (const skill of profile.skills) {
        const evidence = skill.evidence.find((e) => e.id === ref.id);
        if (evidence) {
          return {
            text: evidence.text,
            path: `Skills → ${skill.name} → Evidence`,
          };
        }
      }
      return null;
    }
    case "employment_highlights": {
      for (const job of profile.employment) {
        const highlight = job.highlights.find((h) => h.id === ref.id);
        if (highlight) {
          return {
            text: highlight.text,
            path: `Employment → ${job.company} (${job.jobTitle}) → ${highlight.type}`,
          };
        }
      }
      return null;
    }
    case "education": {
      const edu = profile.education.find((e) => e.id === ref.id);
      if (!edu) return null;
      return {
        text: `${edu.degree}, ${edu.subject} — ${edu.institution}`,
        path: `Education → ${edu.institution}`,
      };
    }
    case "projects": {
      const project = profile.projects.find((p) => p.id === ref.id);
      if (!project) return null;
      return { text: project.description, path: `Projects → ${project.name}` };
    }
    case "certifications": {
      const cert = profile.certifications.find((c) => c.id === ref.id);
      if (!cert) return null;
      return { text: cert.name, path: `Certifications → ${cert.name}` };
    }
    default:
      return null;
  }
}
