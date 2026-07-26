import crypto from "crypto";
import type { CareerProfile, JobDescription, JobRequirementItem, MatchAnalysis, MatchCategory, MatchItem, MatchType, ProfileEntryRef, RequirementCategory } from "../server/types";
import { embed, embedCached, cosineSimilarity } from "../ai/embeddings";
import { generateStructured } from "../ai/structured";
import { matchClassificationSchema } from "../schemas/matchClassification";
import { createMatch, findByInputHash } from "../server/collections/matches";
import { resolveProfileEntry } from "../server/profileRef";

// --- Scoring constants: tuned by a human here, never by the LLM. ---
const MATCH_TYPE_SCORE: Record<MatchType, number> = {
  strong: 1.0,
  partial: 0.6,
  underdeveloped: 0.3,
  missing: 0,
  unknown: 0,
};

const CATEGORY_WEIGHT: Record<MatchCategory, number> = {
  required_skills: 0.3,
  preferred_skills: 0.1,
  experience: 0.2,
  education: 0.1,
  responsibilities: 0.15,
  keywords: 0.05,
  achievements: 0.1,
};

function mapRequirementCategory(cat: RequirementCategory): MatchCategory {
  switch (cat) {
    case "required_skill":
      return "required_skills";
    case "preferred_skill":
      return "preferred_skills";
    case "qualification":
      return "education";
    case "experience":
      return "experience";
    case "responsibility":
    case "soft_skill":
      return "responsibilities";
    case "keyword":
      return "keywords";
  }
}

interface Candidate {
  ref: ProfileEntryRef;
  text: string;
}

function buildCandidates(profile: CareerProfile): Candidate[] {
  const candidates: Candidate[] = [];
  for (const skill of profile.skills) {
    candidates.push({ ref: { table: "skills", id: skill.id }, text: skill.name });
    for (const ev of skill.evidence) {
      candidates.push({ ref: { table: "skill_evidence", id: ev.id }, text: `${skill.name}: ${ev.text}` });
    }
  }
  for (const job of profile.employment) {
    for (const h of job.highlights) {
      candidates.push({
        ref: { table: "employment_highlights", id: h.id },
        text: `${job.jobTitle} at ${job.company}: ${h.text}`,
      });
    }
  }
  for (const edu of profile.education) {
    candidates.push({
      ref: { table: "education", id: edu.id },
      text: `${edu.degree} in ${edu.subject} — ${edu.institution}. ${edu.modules} ${edu.projects}`,
    });
  }
  for (const project of profile.projects) {
    candidates.push({
      ref: { table: "projects", id: project.id },
      text: `${project.name}: ${project.description} (${project.technologies})`,
    });
  }
  for (const cert of profile.certifications) {
    candidates.push({ ref: { table: "certifications", id: cert.id }, text: cert.name });
  }
  return candidates;
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function wordMatch(haystack: string, needle: string): boolean {
  if (!needle.trim()) return false;
  const escaped = needle.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(haystack);
}

/** Fast, deterministic pre-resolution for skill/keyword requirements against exact skill names. */
function resolveByKeyword(item: JobRequirementItem, profile: CareerProfile): MatchItem | null {
  if (!["required_skill", "preferred_skill", "keyword"].includes(item.category)) return null;

  const needles = [item.text, ...item.keywords].map(normalize);

  for (const skill of profile.skills) {
    const skillName = normalize(skill.name);
    const matched = needles.some((n) => wordMatch(n, skillName) || wordMatch(skillName, n));
    if (matched) {
      const hasEvidence = skill.evidence.length > 0;
      const ev = skill.evidence[0];
      return {
        requirementItemId: item.id,
        category: mapRequirementCategory(item.category),
        requirementText: item.text,
        matchType: hasEvidence ? "strong" : "underdeveloped",
        evidenceText: hasEvidence ? ev.text : skill.name,
        evidenceRef: hasEvidence ? { table: "skill_evidence", id: ev.id } : { table: "skills", id: skill.id },
        notes: hasEvidence
          ? null
          : "This skill is listed on your profile but has no supporting evidence recorded yet.",
      };
    }
  }

  for (const job of profile.employment) {
    for (const h of job.highlights) {
      const text = normalize(h.text);
      const matched = needles.some((n) => wordMatch(text, n));
      if (matched) {
        return {
          requirementItemId: item.id,
          category: mapRequirementCategory(item.category),
          requirementText: item.text,
          matchType: "strong",
          evidenceText: h.text,
          evidenceRef: { table: "employment_highlights", id: h.id },
          notes: null,
        };
      }
    }
  }

  return null;
}

function computeAchievementsScore(profile: CareerProfile): number {
  const achievements = profile.employment.flatMap((e) => e.highlights).filter((h) => h.type === "achievement");
  if (achievements.length === 0) return 30;
  const quantified = achievements.filter((h) => /\d/.test(h.text)).length;
  return Math.round((quantified / achievements.length) * 100);
}

function computeInputHash(profile: CareerProfile, requirementItems: JobRequirementItem[]): string {
  const snapshot = JSON.stringify({ profile, requirementItems });
  return crypto.createHash("sha256").update(snapshot).digest("hex");
}

const SHORTLIST_SIZE = 5;
const SIMILARITY_THRESHOLD = 0.35;
const BATCH_SIZE = 15;

/**
 * Order: keyword match (free, deterministic) -> embedding shortlist (retrieval only,
 * narrows the search space) -> one batched LLM classification call per chunk, where
 * the model can only choose from the shortlist it's given -> validate the chosen
 * citation is actually in that shortlist -> compute scores deterministically.
 */
export async function runMatch(profile: CareerProfile, job: JobDescription): Promise<MatchAnalysis> {
  if (job.requirementItems.length === 0) {
    throw new Error("This job description has no extracted requirements yet — run extraction first.");
  }

  const inputHash = computeInputHash(profile, job.requirementItems);
  const cached = findByInputHash(job.id, inputHash);
  if (cached) return cached;

  const candidates = buildCandidates(profile);
  const matchItems: MatchItem[] = [];
  const unresolved: JobRequirementItem[] = [];

  for (const item of job.requirementItems) {
    const resolved = resolveByKeyword(item, profile);
    if (resolved) {
      matchItems.push(resolved);
    } else {
      unresolved.push(item);
    }
  }

  // Embedding shortlist retrieval for everything the keyword pass couldn't resolve.
  const candidateEmbeddings = await Promise.all(
    candidates.map(async (c) => ({
      candidate: c,
      vector: await embedCached(c.ref.table, c.ref.id, c.text),
    }))
  );

  const shortlists = new Map<number, { candidate: Candidate; similarity: number }[]>();
  const stillUnresolved: JobRequirementItem[] = [];

  for (const item of unresolved) {
    if (candidateEmbeddings.length === 0) {
      // Nothing in the profile at all to compare against — we genuinely don't know.
      matchItems.push({
        requirementItemId: item.id,
        category: mapRequirementCategory(item.category),
        requirementText: item.text,
        matchType: "unknown",
        evidenceText: null,
        evidenceRef: null,
        notes: "Your Career Profile doesn't have enough entries yet to evaluate this requirement.",
      });
      continue;
    }

    const itemVector = await embed(item.text);
    const ranked = candidateEmbeddings
      .map((ce) => ({ candidate: ce.candidate, similarity: cosineSimilarity(itemVector, ce.vector) }))
      .filter((r) => r.similarity >= SIMILARITY_THRESHOLD)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, SHORTLIST_SIZE);

    if (ranked.length === 0) {
      matchItems.push({
        requirementItemId: item.id,
        category: mapRequirementCategory(item.category),
        requirementText: item.text,
        matchType: "missing",
        evidenceText: null,
        evidenceRef: null,
        notes: "Not found in your Career Profile — this may still be true of your experience, just not recorded yet.",
      });
      continue;
    }

    shortlists.set(item.id, ranked);
    stillUnresolved.push(item);
  }

  // Batched LLM classification, chunked so context stays manageable with local models.
  for (let i = 0; i < stillUnresolved.length; i += BATCH_SIZE) {
    const chunk = stillUnresolved.slice(i, i + BATCH_SIZE);
    const classified = await classifyChunk(job.id, chunk, shortlists);
    matchItems.push(...classified);
  }

  const categoryScores = computeCategoryScores(matchItems, profile);
  const overallScore = computeOverallScore(categoryScores);

  return createMatch({
    jobDescriptionId: job.id,
    profileVersionAtRun: profile.version,
    inputHash,
    overallScore,
    atsScore: null,
    categoryScores,
    matchItems,
  });
}

let syntheticKeyCounter = 0;

async function classifyChunk(
  jobId: number,
  items: JobRequirementItem[],
  shortlists: Map<number, { candidate: Candidate; similarity: number }[]>
): Promise<MatchItem[]> {
  const keyToCandidate = new Map<number, Candidate>();
  const promptItems = items.map((item) => {
    const list = shortlists.get(item.id) ?? [];
    const candidateLines = list.map((r) => {
      const key = ++syntheticKeyCounter;
      keyToCandidate.set(key, r.candidate);
      return { candidateId: key, text: r.candidate.text };
    });
    return {
      requirementItemId: item.id,
      category: item.category,
      text: item.text,
      candidates: candidateLines,
    };
  });

  const system = `You classify how well a candidate's career profile matches job requirements.
For each requirement, you are given a shortlist of real profile entries (with numeric candidateId).
You must choose EXACTLY ONE candidateId from that requirement's shortlist that best supports the
requirement, or null if none of them genuinely support it — never invent a candidateId that wasn't listed.

Classify matchType using these definitions:
- "strong": a shortlisted entry is clear, direct evidence of this requirement.
- "partial": a shortlisted entry is related but the evidence is weak or incomplete.
- "underdeveloped": there's a relevant entry but it doesn't demonstrate the requirement effectively.
- "missing": none of the shortlisted entries genuinely support this requirement.
- "unknown": you cannot reasonably tell from what's shortlisted.

Never conclude the candidate lacks a skill just because it isn't in the shortlist — say "missing" (not found), not "does not have this".
Respond with ONLY JSON: {"items": [{"requirementItemId": number, "matchType": string, "chosenCandidateId": number|null, "candidateTable": null, "notes": string}]}`;

  const user = JSON.stringify({ requirements: promptItems });

  const result = await generateStructured(
    "match_classification",
    system,
    user,
    matchClassificationSchema,
    { refTable: "job_descriptions", refId: jobId, temperature: 0 }
  );

  return items.map((item) => {
    const list = shortlists.get(item.id) ?? [];
    const validKeys = new Set(
      Array.from(keyToCandidate.entries())
        .filter(([, c]) => list.some((r) => r.candidate === c))
        .map(([k]) => k)
    );
    const classification = result.items.find((r) => r.requirementItemId === item.id);

    if (!classification) {
      return {
        requirementItemId: item.id,
        category: mapRequirementCategory(item.category),
        requirementText: item.text,
        matchType: "unknown" as MatchType,
        evidenceText: null,
        evidenceRef: null,
        notes: "The AI did not return a classification for this requirement; treated as unknown.",
      };
    }

    const chosenKey = classification.chosenCandidateId;
    const isValidCitation = chosenKey !== null && validKeys.has(chosenKey);
    const candidate = isValidCitation ? keyToCandidate.get(chosenKey!) : undefined;

    if (chosenKey !== null && !isValidCitation) {
      // Defense in depth: the model cited something outside its given shortlist. Discard it.
      return {
        requirementItemId: item.id,
        category: mapRequirementCategory(item.category),
        requirementText: item.text,
        matchType: "unknown" as MatchType,
        evidenceText: null,
        evidenceRef: null,
        notes: "The AI's citation for this item couldn't be verified against your profile, so it was discarded.",
      };
    }

    return {
      requirementItemId: item.id,
      category: mapRequirementCategory(item.category),
      requirementText: item.text,
      matchType: classification.matchType,
      evidenceText: candidate?.text ?? null,
      evidenceRef: candidate?.ref ?? null,
      notes: classification.notes || null,
    };
  });
}

function computeCategoryScores(
  matchItems: MatchItem[],
  profile: CareerProfile
): MatchAnalysis["categoryScores"] {
  const byCategory: Record<MatchCategory, MatchItem[]> = {
    required_skills: [],
    preferred_skills: [],
    experience: [],
    education: [],
    responsibilities: [],
    keywords: [],
    achievements: [],
  };
  for (const item of matchItems) byCategory[item.category].push(item);

  const scores = {} as MatchAnalysis["categoryScores"];
  for (const category of Object.keys(byCategory) as MatchCategory[]) {
    if (category === "achievements") continue;
    const items = byCategory[category];
    if (items.length === 0) {
      scores[category] = null;
      continue;
    }
    const avg = items.reduce((sum, i) => sum + MATCH_TYPE_SCORE[i.matchType], 0) / items.length;
    scores[category] = Math.round(avg * 100);
  }
  scores.achievements = computeAchievementsScore(profile);
  return scores;
}

function computeOverallScore(categoryScores: MatchAnalysis["categoryScores"]): number {
  let weightedSum = 0;
  let weightTotal = 0;
  for (const category of Object.keys(categoryScores) as MatchCategory[]) {
    const score = categoryScores[category];
    if (score === null) continue;
    const weight = CATEGORY_WEIGHT[category];
    weightedSum += score * weight;
    weightTotal += weight;
  }
  if (weightTotal === 0) return 0;
  return Math.round(weightedSum / weightTotal);
}
