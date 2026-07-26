import { z } from "zod";

// Local models sometimes prefer a richer {pattern, examples} shape here over a flat
// string, despite the prompt asking for strings — this accepts either and normalizes
// to a single display string, rather than failing the whole parse over one field.
const flexibleStringItem = z
  .union([
    z.string(),
    z.object({
      pattern: z.string().optional(),
      text: z.string().optional(),
      examples: z.array(z.string()).optional(),
    }),
  ])
  .transform((item) => {
    if (typeof item === "string") return item;
    const base = item.pattern ?? item.text ?? "";
    const examples = item.examples?.length ? ` — e.g. ${item.examples.join("; ")}` : "";
    return `${base}${examples}`;
  });

export const idealCvBlueprintSchema = z.object({
  structure: z.array(z.string()),
  summaryExample: z.string(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  experienceExpectations: z.array(flexibleStringItem),
  achievementExamplePatterns: z.array(flexibleStringItem),
});

export type IdealCvBlueprintResult = z.infer<typeof idealCvBlueprintSchema>;
