import { NextRequest, NextResponse } from "next/server";
import { getSuggestion, resolveSuggestion } from "@/lib/server/collections/profileImportSuggestions";
import {
  savePersonalInfo,
  addEducation,
  addEmployment,
  addHighlight,
  addSkill,
  addSkillEvidence,
  addProject,
  addCertification,
  getProfile,
} from "@/lib/server/collections/profile";
import { profileSuggestionSchema } from "@/lib/schemas/profileSuggestion";

/**
 * The only path CV content ever enters the trusted Career Profile: the client sends
 * back exactly the fields the user reviewed and approved (a pruned/edited copy of the
 * suggestion), which we merge in here field by field.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const suggestion = getSuggestion(Number(id));
  if (!suggestion) return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });

  const body = await req.json();
  const approved = profileSuggestionSchema.parse(body);

  if (approved.personalInfo && Object.values(approved.personalInfo).some((v) => v)) {
    const current = getProfile().personalInfo;
    await savePersonalInfo({ ...current, ...approved.personalInfo });
  }

  for (const edu of approved.education) {
    await addEducation(edu);
  }

  for (const job of approved.employment) {
    const profile = await addEmployment({
      company: job.company,
      jobTitle: job.jobTitle,
      location: job.location,
      startDate: job.startDate,
      endDate: job.endDate,
    });
    const created = profile.employment[profile.employment.length - 1];
    for (const h of job.highlights) {
      await addHighlight(created.id, h);
    }
  }

  for (const skill of approved.skills) {
    const profile = await addSkill({ name: skill.name, level: skill.level });
    const created = profile.skills[profile.skills.length - 1];
    if (skill.evidenceText) {
      await addSkillEvidence(created.id, {
        text: skill.evidenceText,
        where: "employment",
        verified: false,
      });
    }
  }

  for (const project of approved.projects) {
    await addProject({
      name: project.name,
      description: project.description,
      technologies: project.technologies,
      responsibilities: "",
      results: project.results,
      metrics: "",
      links: "",
    });
  }

  for (const cert of approved.certifications) {
    await addCertification({
      name: cert.name,
      organisation: cert.organisation,
      date: cert.date,
      expiryDate: "",
      certificateNumber: "",
    });
  }

  const isFullyApplied =
    approved.education.length === (suggestion.suggestedJson as { education?: unknown[] })?.education?.length &&
    approved.employment.length === (suggestion.suggestedJson as { employment?: unknown[] })?.employment?.length;

  await resolveSuggestion(suggestion.id, isFullyApplied ? "applied" : "partially_applied", approved);

  return NextResponse.json({ ok: true, profile: getProfile() });
}
