import { z } from "zod";

// The LLM picks ONE candidate id from a pre-narrowed shortlist it was given (or null
// for "none apply") — it never free-types a citation, which is what makes fabricated
// evidence structurally impossible rather than just discouraged by prompting.
export const matchClassificationItemSchema = z.object({
  requirementItemId: z.number(),
  matchType: z.enum(["strong", "partial", "underdeveloped", "missing", "unknown"]).catch("unknown"),
  chosenCandidateId: z.number().nullable().catch(null),
  // Parsed for completeness but not actually relied on — matchEngine.ts derives the real
  // citation table from its own candidate-id lookup map, never from this field.
  candidateTable: z
    .enum(["employment_highlights", "skills", "skill_evidence", "education", "projects", "certifications"])
    .nullable()
    .catch(null),
  notes: z.string().optional().catch("").default(""),
});

export const matchClassificationSchema = z.object({
  items: z.array(matchClassificationItemSchema),
});

export type MatchClassificationResult = z.infer<typeof matchClassificationSchema>;
