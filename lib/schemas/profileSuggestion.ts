import { z } from "zod";

// A suggestion parsed from an uploaded CV — never auto-applied to the trusted
// Career Profile. The user reviews and approves fields individually.
export const profileSuggestionSchema = z.object({
  personalInfo: z
    .object({
      name: z.string().optional().default(""),
      email: z.string().optional().default(""),
      phone: z.string().optional().default(""),
      location: z.string().optional().default(""),
      linkedin: z.string().optional().default(""),
      github: z.string().optional().default(""),
      portfolio: z.string().optional().default(""),
      website: z.string().optional().default(""),
    })
    .optional(),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string().optional().default(""),
        subject: z.string().optional().default(""),
        grade: z.string().optional().default(""),
        startDate: z.string().optional().default(""),
        endDate: z.string().optional().default(""),
        modules: z.string().optional().default(""),
        projects: z.string().optional().default(""),
      })
    )
    .default([]),
  employment: z
    .array(
      z.object({
        company: z.string(),
        jobTitle: z.string().optional().default(""),
        location: z.string().optional().default(""),
        startDate: z.string().optional().default(""),
        endDate: z.string().optional().default(""),
        highlights: z
          .array(
            z.object({
              type: z.enum(["responsibility", "achievement", "technology", "project"]).catch("responsibility"),
              text: z.string(),
            })
          )
          .default([]),
      })
    )
    .default([]),
  skills: z
    .array(
      z.object({
        name: z.string(),
        level: z.enum(["beginner", "intermediate", "advanced", "expert"]).catch("intermediate"),
        evidenceText: z.string().optional().default(""),
      })
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional().default(""),
        technologies: z.string().optional().default(""),
        results: z.string().optional().default(""),
      })
    )
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        organisation: z.string().optional().default(""),
        date: z.string().optional().default(""),
      })
    )
    .default([]),
});

export type ProfileSuggestionResult = z.infer<typeof profileSuggestionSchema>;
