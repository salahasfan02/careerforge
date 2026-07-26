import { z } from "zod";
import type {
  CareerProfile,
  CvBuildContent,
  CvExperienceItem,
  CvGenerationMode,
  CvRecord,
  EmploymentEntry,
  JobDescription,
  MatchAnalysis,
} from "../server/types";
import { generateStructured } from "../ai/structured";
import { embed, embedCached, cosineSimilarity } from "../ai/embeddings";

const rephraseSchema = z.object({
  items: z.array(z.object({ id: z.number(), improvedText: z.string() })),
});

const REPHRASE_SYSTEM = `You improve the wording of CV bullet points for clarity, professional tone, and impact.
Rules:
- Do NOT add any fact, number, technology, employer, or outcome that isn't already stated in the original text.
- Do NOT remove the core fact of the bullet — only improve HOW it's expressed.
- Prefer strong action verbs and concise, achievement-oriented phrasing.
- Respond with ONLY JSON: {"items": [{"id": number, "improvedText": string}]} — exactly one entry per input, matching id.`;

/** Rephrases a batch of highlight texts 1:1 by id — never asked to invent new bullets, only reword given ones. */
async function rephraseHighlights(
  refId: number,
  highlights: { id: number; text: string }[]
): Promise<Map<number, string>> {
  if (highlights.length === 0) return new Map();
  const user = JSON.stringify({ bullets: highlights });
  const result = await generateStructured("cv_generation", REPHRASE_SYSTEM, user, rephraseSchema, {
    refTable: "employment_highlights",
    refId,
    temperature: 0.2,
  });
  const map = new Map<number, string>();
  for (const item of result.items) map.set(item.id, item.improvedText);
  return map;
}

function parseDateToMonths(dateStr: string, fallback: Date): number {
  const match = /^(\d{4})-(\d{2})$/.exec(dateStr.trim());
  if (!match) return fallback.getFullYear() * 12 + fallback.getMonth();
  return Number(match[1]) * 12 + (Number(match[2]) - 1);
}

/** Deterministic — never asks the LLM to guess how many years of experience someone has. */
function computeTotalYearsExperience(profile: CareerProfile): number {
  if (profile.employment.length === 0) return 0;
  const now = new Date();
  let earliestMonths = Infinity;
  let latestMonths = -Infinity;
  for (const job of profile.employment) {
    const start = parseDateToMonths(job.startDate, now);
    const end = job.endDate.trim() ? parseDateToMonths(job.endDate, now) : now.getFullYear() * 12 + now.getMonth();
    earliestMonths = Math.min(earliestMonths, start);
    latestMonths = Math.max(latestMonths, end);
  }
  if (!Number.isFinite(earliestMonths)) return 0;
  return Math.max(0, Math.round((latestMonths - earliestMonths) / 12));
}

const summarySchema = z.object({ summary: z.string() });

async function composeSummary(params: {
  jobTitles: string[];
  totalYears: number;
  topSkills: string[];
  targetJobTitle?: string;
}): Promise<string> {
  const system = `You write a 2-4 sentence professional CV summary using ONLY the facts provided.
Rules:
- Do not invent employers, achievements, numbers, or skills beyond what's given.
- You may state the provided total years of experience and job titles/skills as facts.
- If a target role is given, you may note fit in general terms, without claiming unstated experience with that specific employer.
- Respond with ONLY JSON: {"summary": string}`;
  const user = JSON.stringify(params);
  const result = await generateStructured("cv_generation", system, user, summarySchema, {
    temperature: 0.3,
  });
  return result.summary;
}

async function buildExperienceSection(
  employment: EmploymentEntry[],
  relevantHighlightIds?: Set<number>
): Promise<CvExperienceItem[]> {
  const items: CvExperienceItem[] = [];
  for (const job of employment) {
    const selected = relevantHighlightIds
      ? job.highlights.filter((h) => relevantHighlightIds.has(h.id))
      : job.highlights;
    if (selected.length === 0) continue;

    const improved = await rephraseHighlights(
      job.id,
      selected.map((h) => ({ id: h.id, text: h.text }))
    );

    items.push({
      jobTitle: job.jobTitle,
      company: job.company,
      location: job.location,
      startDate: job.startDate,
      endDate: job.endDate,
      bullets: selected.map((h) => ({
        text: improved.get(h.id) ?? h.text,
        evidenceRef: { table: "employment_highlights", id: h.id },
      })),
    });
  }
  return items;
}

/** Ranks highlights + skills by relevance to a job's requirements using cached embeddings. */
async function selectRelevantForJob(
  profile: CareerProfile,
  job: JobDescription,
  matchAnalysis: MatchAnalysis | null
): Promise<{ highlightIds: Set<number>; skillNames: string[] }> {
  const strongOrPartialSkillNames = new Set(
    (matchAnalysis?.matchItems ?? [])
      .filter((i) => i.matchType === "strong" || i.matchType === "partial")
      .map((i) => i.evidenceText)
      .filter((t): t is string => !!t)
  );

  const jobText = job.requirementItems.map((r) => r.text).join(". ");
  const jobVector = jobText ? await embed(jobText) : null;

  const highlightIds = new Set<number>();
  const MAX_PER_JOB = 5;
  for (const empJob of profile.employment) {
    const scored: { id: number; score: number }[] = [];
    for (const h of empJob.highlights) {
      if (!jobVector) {
        scored.push({ id: h.id, score: 0 });
        continue;
      }
      const vector = await embedCached("employment_highlights", h.id, `${empJob.jobTitle} at ${empJob.company}: ${h.text}`);
      scored.push({ id: h.id, score: cosineSimilarity(jobVector, vector) });
    }
    scored
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_PER_JOB)
      .forEach((s) => highlightIds.add(s.id));
  }

  const requiredSkillTexts = new Set(
    job.requirementItems
      .filter((r) => r.category === "required_skill" || r.category === "preferred_skill")
      .map((r) => r.text.toLowerCase())
  );
  const rankedSkills = profile.skills
    .map((s) => ({
      name: s.name,
      priority:
        strongOrPartialSkillNames.has(s.name) || requiredSkillTexts.has(s.name.toLowerCase()) ? 1 : 0,
    }))
    .sort((a, b) => b.priority - a.priority)
    .map((s) => s.name);

  return { highlightIds, skillNames: rankedSkills };
}

export interface GenerateCvParams {
  mode: CvGenerationMode;
  profile: CareerProfile;
  job?: JobDescription;
  matchAnalysis?: MatchAnalysis | null;
  sourceCv?: CvRecord;
}

const improvedCvSchema = z.object({
  summary: z.string(),
  skills: z.array(z.string()),
  experience: z.array(
    z.object({
      jobTitle: z.string(),
      company: z.string(),
      location: z.string().optional().default(""),
      startDate: z.string().optional().default(""),
      endDate: z.string().optional().default(""),
      bullets: z.array(z.string()),
    })
  ),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string().optional().default(""),
      subject: z.string().optional().default(""),
      grade: z.string().optional().default(""),
      startDate: z.string().optional().default(""),
      endDate: z.string().optional().default(""),
    })
  ),
});

const IMPROVE_SYSTEM = `You improve an existing CV's grammar, clarity, structure, and bullet-point quality.
Rules:
- Do NOT invent or add any employer, job title, date, skill, achievement, or number not already in the CV text.
- Do NOT change the substance of any claim — only its wording, structure, and clarity.
- Group content into: summary, skills, experience (with company/title/dates/bullets), education.
- Respond with ONLY JSON matching the required shape, no commentary.`;

/**
 * Mode 1 operates on the CV document itself, not the Career Profile — so bullets here
 * are grounded in the uploaded CV's own words, not a ProfileEntryRef citation. This is a
 * deliberate difference from modes 2/3 (see cv_build.mode in the UI, which explains this).
 */
async function improveExistingCv(sourceCv: CvRecord): Promise<CvBuildContent> {
  const result = await generateStructured(
    "cv_generation",
    IMPROVE_SYSTEM,
    `CV text:\n\n${sourceCv.rawText}`,
    improvedCvSchema,
    { refTable: "cvs", refId: sourceCv.id, temperature: 0.2 }
  );

  return {
    personalInfo: { name: "", email: "", phone: "", location: "", linkedin: "", github: "", portfolio: "", website: "" },
    summary: result.summary,
    skills: result.skills,
    experience: result.experience.map((e) => ({
      jobTitle: e.jobTitle,
      company: e.company,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      bullets: e.bullets.map((b) => ({ text: b, evidenceRef: null })),
    })),
    projects: [],
    education: result.education,
    certifications: [],
    sectionOrder: ["summary", "skills", "experience", "education", "projects", "certifications"],
  };
}

export async function generateCvContent(params: GenerateCvParams): Promise<CvBuildContent> {
  const { mode, profile } = params;

  if (mode === "improve") {
    if (!params.sourceCv) throw new Error("Mode 1 requires a source CV.");
    return improveExistingCv(params.sourceCv);
  }

  let highlightIds: Set<number> | undefined;
  let skillNames = profile.skills.map((s) => s.name);

  if (mode === "tailor") {
    if (!params.job) throw new Error("Mode 2 requires a target job.");
    const selection = await selectRelevantForJob(profile, params.job, params.matchAnalysis ?? null);
    highlightIds = selection.highlightIds;
    skillNames = selection.skillNames;
  }

  const experience = await buildExperienceSection(profile.employment, highlightIds);

  const totalYears = computeTotalYearsExperience(profile);
  const jobTitles = [...new Set(profile.employment.map((e) => e.jobTitle).filter(Boolean))];
  const summary = await composeSummary({
    jobTitles,
    totalYears,
    topSkills: skillNames.slice(0, 8),
    targetJobTitle: params.job?.title,
  });

  return {
    personalInfo: profile.personalInfo,
    summary,
    skills: skillNames,
    experience,
    projects: profile.projects.map((p) => ({ name: p.name, description: p.description, technologies: p.technologies })),
    education: profile.education.map((e) => ({
      institution: e.institution,
      degree: e.degree,
      subject: e.subject,
      grade: e.grade,
      startDate: e.startDate,
      endDate: e.endDate,
    })),
    certifications: profile.certifications.map((c) => ({ name: c.name, organisation: c.organisation, date: c.date })),
    sectionOrder: ["summary", "skills", "experience", "projects", "education", "certifications"],
  };
}
