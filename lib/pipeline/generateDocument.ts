import { z } from "zod";
import { generateStructured } from "../ai/structured";
import type { CareerProfile, GeneratedDocumentType, JobDescription, MatchAnalysis } from "../server/types";

const documentSchema = z.object({ content: z.string() });

const TYPE_LABEL: Record<GeneratedDocumentType, string> = {
  cover_letter: "cover letter",
  supporting_statement: "supporting statement",
  personal_statement: "personal statement",
  recruiter_message: "short message to a recruiter",
};

export interface GenerateDocumentParams {
  type: GeneratedDocumentType;
  profile: CareerProfile;
  job?: JobDescription;
  matchAnalysis?: MatchAnalysis | null;
  maxWords: number;
  style: string;
  useStarExamples: boolean;
}

function summarizeVerifiedFacts(profile: CareerProfile, matchAnalysis?: MatchAnalysis | null) {
  const strongEvidence = (matchAnalysis?.matchItems ?? [])
    .filter((i) => i.matchType === "strong" || i.matchType === "partial")
    .map((i) => i.evidenceText)
    .filter((t): t is string => !!t);

  return {
    name: profile.personalInfo.name,
    employment: profile.employment.map((e) => ({
      jobTitle: e.jobTitle,
      company: e.company,
      startDate: e.startDate,
      endDate: e.endDate,
      highlights: e.highlights.map((h) => h.text),
    })),
    education: profile.education.map((e) => ({
      institution: e.institution,
      degree: e.degree,
      subject: e.subject,
      grade: e.grade,
      startDate: e.startDate,
      endDate: e.endDate,
    })),
    skills: profile.skills.map((s) => s.name),
    projects: profile.projects.map((p) => `${p.name}: ${p.description}`),
    certifications: profile.certifications.map((c) => c.name),
    mostRelevantEvidence: strongEvidence,
  };
}

/**
 * Free-form prose generation is inherently harder to ground bullet-by-bullet than the CV
 * builder's 1:1 rephrase step. We only supply real, verified profile facts as context and
 * instruct the model never to add unstated specifics — but the UI must still present this
 * as an AI draft for the user to review, not a final, verified document.
 */
export async function generateDocument(params: GenerateDocumentParams): Promise<{ content: string; wordCount: number }> {
  const facts = summarizeVerifiedFacts(params.profile, params.matchAnalysis);
  const label = TYPE_LABEL[params.type];

  const system = `You write a ${label} for a job application, using ONLY the verified facts about the
candidate provided to you in "candidateFacts".
Rules:
- Never invent employers, job titles, dates, degrees, institutions, skills, achievements, or statistics
  not present in candidateFacts. Do not "fill in" plausible-sounding details for categories that are
  empty or missing — if candidateFacts.education is an empty array, do not mention education at all.
- Do not assume the candidate has a degree, a particular school, or any credential unless it appears
  in candidateFacts.education or candidateFacts.certifications.
- If the job description is provided, address why the candidate is a good fit using genuine overlaps only.
- Maximum length: approximately ${params.maxWords} words. Stay at or under this.
- Writing style: ${params.style}.
${params.useStarExamples ? "- Where you reference a specific achievement, structure it briefly as Situation/Task/Action/Result using only the given facts." : ""}
- Respond with ONLY JSON: {"content": string}`;

  const user = JSON.stringify({
    candidateFacts: facts,
    jobTitle: params.job?.title,
    company: params.job?.company,
    jobDescription: params.job?.rawText,
  });

  const result = await generateStructured("cover_letter", system, user, documentSchema, {
    refTable: "job_descriptions",
    refId: params.job?.id,
    temperature: 0.4,
  });

  const wordCount = result.content.trim().split(/\s+/).filter(Boolean).length;
  return { content: result.content, wordCount };
}
