import { generateStructured } from "../ai/structured";
import { jobRequirementsSchema, type JobRequirementsResult } from "../schemas/jobRequirements";

const SYSTEM_PROMPT = `You extract structured hiring requirements from a job description.
Rules:
- Only extract what is actually stated or clearly implied in the text. Do not invent requirements.
- Classify every item into exactly one category: required_skill, preferred_skill, responsibility, qualification, experience, soft_skill, keyword.
- "keyword" is for important terms/technologies mentioned that don't fit neatly elsewhere (e.g. tool names, methodologies).
- For each item, include "keywords": exact terms plus close semantic equivalents a CV might use to describe the same thing (e.g. "developed predictive models" as a semantic equivalent of "machine learning").
- Respond with ONLY JSON matching this exact shape, no commentary:
{"title": string, "company": string, "items": [{"category": string, "text": string, "keywords": string[]}]}`;

export async function extractJobRequirements(
  jobDescriptionId: number,
  rawText: string
): Promise<JobRequirementsResult> {
  return generateStructured(
    "requirement_extraction",
    SYSTEM_PROMPT,
    `Job description:\n\n${rawText}`,
    jobRequirementsSchema,
    { refTable: "job_descriptions", refId: jobDescriptionId, temperature: 0 }
  );
}
