import { z } from "zod";

export const requirementCategorySchema = z.enum([
  "required_skill",
  "preferred_skill",
  "responsibility",
  "qualification",
  "experience",
  "soft_skill",
  "keyword",
]);

export const jobRequirementsSchema = z.object({
  title: z.string(),
  company: z.string().optional().default(""),
  items: z.array(
    z.object({
      category: requirementCategorySchema.catch("keyword"),
      text: z.string(),
      keywords: z.array(z.string()).default([]),
    })
  ),
});

export type JobRequirementsResult = z.infer<typeof jobRequirementsSchema>;
