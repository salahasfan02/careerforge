import { generateStructured } from "../ai/structured";
import { idealCvBlueprintSchema, type IdealCvBlueprintResult } from "../schemas/idealCvBlueprint";
import type { JobRequirementItem } from "../server/types";

const SYSTEM_PROMPT = `You describe what an ideal candidate's CV would look like for a given job description.
This is an illustrative blueprint, NOT a claim about any specific real person — never phrase anything
as "you have" or "your experience shows"; always phrase it as what a strong candidate WOULD demonstrate.
Rules:
- Base everything on the job requirements provided. Do not invent unrelated requirements.
- "structure" is the ordered list of CV SECTION HEADINGS a strong CV for this role would use — e.g.
  ["Professional Summary", "Core Technical Skills", "Relevant Professional Experience", "Key Projects",
  "Education", "Certifications"]. It is NOT a list of skills or requirements — do not put skill names here.
- summaryExample should read like a sample professional summary a strong candidate might write — generic
  enough that it's clearly an example, not personalized claims.
- achievementExamplePatterns should describe the SHAPE of a strong achievement (e.g. "Action + Technology +
  Measurable result"), with one or two illustrative example sentences per pattern, clearly hypothetical.
- achievementExamplePatterns and experienceExpectations MUST each be a flat array of plain strings — every
  array element is one string combining the pattern/expectation and its example in a single sentence, e.g.
  "Action + Technology + Measurable result — e.g. 'Automated a reporting pipeline in Python, cutting manual
  turnaround from days to hours.'" — NOT an array of objects.
- Respond with ONLY JSON matching this exact shape, no commentary:
{"structure": string[], "summaryExample": string, "requiredSkills": string[], "preferredSkills": string[],
"experienceExpectations": string[], "achievementExamplePatterns": string[]}`;

export async function generateIdealCvBlueprint(
  jobDescriptionId: number,
  jobTitle: string,
  requirementItems: JobRequirementItem[]
): Promise<IdealCvBlueprintResult> {
  const user = JSON.stringify({
    jobTitle,
    requirements: requirementItems.map((r) => ({ category: r.category, text: r.text })),
  });

  return generateStructured(
    "blueprint",
    SYSTEM_PROMPT,
    user,
    idealCvBlueprintSchema,
    { refTable: "job_descriptions", refId: jobDescriptionId, temperature: 0.4 }
  );
}
