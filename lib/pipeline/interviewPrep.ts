import { z } from "zod";
import { generateStructured } from "../ai/structured";
import type { CareerProfile, InterviewFeedback, InterviewQuestionCategory, JobDescription, StarAnswer } from "../server/types";

const questionsSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      category: z.enum(["behavioral", "technical", "situational", "general"]),
    })
  ),
});

export async function generateInterviewQuestions(
  job: JobDescription
): Promise<{ question: string; category: InterviewQuestionCategory }[]> {
  const system = `You generate likely interview questions for a job based on its requirements.
Rules:
- Base questions on the job's required skills, responsibilities, qualifications, and soft skills.
- Include a mix of categories: behavioral, technical, situational, general.
- Generate 8-10 questions.
- Respond with ONLY JSON: {"questions": [{"question": string, "category": string}]}`;

  const user = JSON.stringify({
    title: job.title,
    requirements: job.requirementItems.map((r) => ({ category: r.category, text: r.text })),
  });

  const result = await generateStructured("interview_questions", system, user, questionsSchema, {
    refTable: "job_descriptions",
    refId: job.id,
    temperature: 0.3,
  });
  return result.questions;
}

const starSchema = z.object({
  situation: z.string(),
  task: z.string(),
  action: z.string(),
  result: z.string(),
});

/**
 * Drafts a STAR answer grounded in the candidate's real profile. If there isn't enough
 * genuine evidence to answer well, the model is instructed to say so explicitly (in the
 * Result field) rather than inventing a scenario — consistent with the product's rule
 * that missing evidence must never be silently papered over.
 */
export async function generateStarAnswer(
  question: string,
  profile: CareerProfile
): Promise<StarAnswer> {
  const system = `You help a candidate draft a STAR-structured interview answer (Situation, Task,
Action, Result) using ONLY their real, verified experience provided below.
Rules:
- Do not invent a scenario, employer, or outcome that isn't grounded in the facts given.
- If the candidate's profile doesn't contain a clear real example for this question, say so plainly in
  the "result" field (e.g. "Your profile doesn't have a clear example for this yet — consider adding one.")
  rather than fabricating one.
- Respond with ONLY JSON: {"situation": string, "task": string, "action": string, "result": string}`;

  const user = JSON.stringify({
    question,
    employment: profile.employment.map((e) => ({
      jobTitle: e.jobTitle,
      company: e.company,
      highlights: e.highlights.map((h) => h.text),
    })),
    projects: profile.projects.map((p) => `${p.name}: ${p.description}. Results: ${p.results}`),
    skills: profile.skills.map((s) => s.name),
  });

  return generateStructured("interview_questions", system, user, starSchema, { temperature: 0.3 });
}

const feedbackSchema = z.object({
  relevance: z.string(),
  clarity: z.string(),
  structure: z.string(),
  evidence: z.string(),
  missingDetails: z.string(),
});

export async function generateInterviewFeedback(
  question: string,
  answer: string,
  profile: CareerProfile
): Promise<InterviewFeedback> {
  const system = `You give constructive feedback on a candidate's spoken/typed interview answer.
Rate and comment briefly (1-2 sentences each) on:
- relevance: did they actually answer the question asked?
- clarity: was it easy to follow?
- structure: did they use a clear structure (e.g. STAR) or ramble?
- evidence: did they give concrete, specific evidence rather than vague claims?
- missingDetails: what's missing that would make this answer stronger (e.g. a measurable result)?
Be honest and specific, not just encouraging. Respond with ONLY JSON matching the required shape.`;

  const user = JSON.stringify({
    question,
    answer,
    candidateSkills: profile.skills.map((s) => s.name),
  });

  return generateStructured("interview_feedback", system, user, feedbackSchema, { temperature: 0.2 });
}
