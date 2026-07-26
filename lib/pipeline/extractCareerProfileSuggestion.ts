import { generateStructured } from "../ai/structured";
import { profileSuggestionSchema, type ProfileSuggestionResult } from "../schemas/profileSuggestion";

const SYSTEM_PROMPT = `You read a CV/resume and extract its content into structured fields, to be
reviewed by the person before anything is trusted.
Rules:
- Only extract what is explicitly written in the CV. Never invent, infer, or embellish
  employers, job titles, dates, skills, achievements, or numbers that aren't present.
- If a field isn't stated, leave it empty rather than guessing.
- Split employment bullet points into responsibility / achievement / technology / project highlights.
- Respond with ONLY JSON matching this exact shape, no commentary, no extra top-level fields:
{
  "personalInfo": {"name": string, "email": string, "phone": string, "location": string, "linkedin": string, "github": string, "portfolio": string, "website": string},
  "education": [{"institution": string, "degree": string, "subject": string, "grade": string, "startDate": string, "endDate": string, "modules": string, "projects": string}],
  "employment": [{"company": string, "jobTitle": string, "location": string, "startDate": string, "endDate": string, "highlights": [{"type": "responsibility"|"achievement"|"technology"|"project", "text": string}]}],
  "skills": [{"name": string, "level": "beginner"|"intermediate"|"advanced"|"expert", "evidenceText": string}],
  "projects": [{"name": string, "description": string, "technologies": string, "results": string}],
  "certifications": [{"name": string, "organisation": string, "date": string}]
}
- Every employment entry's bullet points go inside its "highlights" array as {type, text} objects —
  never as separate top-level "responsibilities"/"achievements" arrays.`;

/**
 * Parses an uploaded CV into a structured *suggestion*. This is never written directly
 * to the trusted Career Profile — the caller must route it through the
 * profile_import_suggestions review flow so the user approves each field first.
 */
export async function extractCareerProfileSuggestion(
  cvId: number | null,
  rawText: string
): Promise<ProfileSuggestionResult> {
  return generateStructured(
    "profile_suggestion",
    SYSTEM_PROMPT,
    `CV text:\n\n${rawText}`,
    profileSuggestionSchema,
    cvId === null ? { temperature: 0 } : { refTable: "cvs", refId: cvId, temperature: 0 }
  );
}
