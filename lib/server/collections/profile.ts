import { readStore, updateStore } from "../store";
import type {
  CareerProfile,
  EducationEntry,
  EmploymentEntry,
  EmploymentHighlight,
  CertificationEntry,
  ProjectEntry,
  SkillEntry,
  SkillEvidence,
} from "../types";

const FILE = "profile.json";

const DEFAULT_PROFILE: CareerProfile = {
  personalInfo: {
    name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
    website: "",
  },
  education: [],
  employment: [],
  skills: [],
  projects: [],
  certifications: [],
  version: 1,
  nextIds: {
    education: 1,
    employment: 1,
    highlight: 1,
    skill: 1,
    evidence: 1,
    project: 1,
    certification: 1,
  },
};

export function getProfile(): CareerProfile {
  return readStore(FILE, DEFAULT_PROFILE);
}

async function mutate(fn: (p: CareerProfile) => void): Promise<CareerProfile> {
  return updateStore(FILE, DEFAULT_PROFILE, (p) => {
    fn(p);
    p.version += 1;
  });
}

export function savePersonalInfo(info: CareerProfile["personalInfo"]) {
  return mutate((p) => {
    p.personalInfo = info;
  });
}

// ---- Education ----
export function addEducation(entry: Omit<EducationEntry, "id">) {
  return mutate((p) => {
    const id = p.nextIds.education++;
    p.education.push({ ...entry, id });
  });
}
export function updateEducation(id: number, entry: Omit<EducationEntry, "id">) {
  return mutate((p) => {
    const idx = p.education.findIndex((e) => e.id === id);
    if (idx >= 0) p.education[idx] = { ...entry, id };
  });
}
export function deleteEducation(id: number) {
  return mutate((p) => {
    p.education = p.education.filter((e) => e.id !== id);
  });
}

// ---- Employment ----
export function addEmployment(entry: Omit<EmploymentEntry, "id" | "highlights">) {
  return mutate((p) => {
    const id = p.nextIds.employment++;
    p.employment.push({ ...entry, id, highlights: [] });
  });
}
export function updateEmployment(id: number, entry: Omit<EmploymentEntry, "id" | "highlights">) {
  return mutate((p) => {
    const job = p.employment.find((e) => e.id === id);
    if (job) Object.assign(job, entry);
  });
}
export function deleteEmployment(id: number) {
  return mutate((p) => {
    p.employment = p.employment.filter((e) => e.id !== id);
  });
}
export function addHighlight(employmentId: number, highlight: Omit<EmploymentHighlight, "id">) {
  return mutate((p) => {
    const job = p.employment.find((e) => e.id === employmentId);
    if (!job) throw new Error("Employment entry not found");
    const id = p.nextIds.highlight++;
    job.highlights.push({ ...highlight, id });
  });
}
export function updateHighlight(
  employmentId: number,
  highlightId: number,
  highlight: Omit<EmploymentHighlight, "id">
) {
  return mutate((p) => {
    const job = p.employment.find((e) => e.id === employmentId);
    const h = job?.highlights.find((h) => h.id === highlightId);
    if (h) Object.assign(h, highlight);
  });
}
export function deleteHighlight(employmentId: number, highlightId: number) {
  return mutate((p) => {
    const job = p.employment.find((e) => e.id === employmentId);
    if (job) job.highlights = job.highlights.filter((h) => h.id !== highlightId);
  });
}

// ---- Skills ----
export function addSkill(entry: Omit<SkillEntry, "id" | "evidence">) {
  return mutate((p) => {
    const id = p.nextIds.skill++;
    p.skills.push({ ...entry, id, evidence: [] });
  });
}
export function updateSkill(id: number, entry: Omit<SkillEntry, "id" | "evidence">) {
  return mutate((p) => {
    const skill = p.skills.find((s) => s.id === id);
    if (skill) Object.assign(skill, entry);
  });
}
export function deleteSkill(id: number) {
  return mutate((p) => {
    p.skills = p.skills.filter((s) => s.id !== id);
  });
}
export function addSkillEvidence(skillId: number, evidence: Omit<SkillEvidence, "id">) {
  return mutate((p) => {
    const skill = p.skills.find((s) => s.id === skillId);
    if (!skill) throw new Error("Skill not found");
    const id = p.nextIds.evidence++;
    skill.evidence.push({ ...evidence, id });
  });
}
export function deleteSkillEvidence(skillId: number, evidenceId: number) {
  return mutate((p) => {
    const skill = p.skills.find((s) => s.id === skillId);
    if (skill) skill.evidence = skill.evidence.filter((e) => e.id !== evidenceId);
  });
}

// ---- Projects ----
export function addProject(entry: Omit<ProjectEntry, "id">) {
  return mutate((p) => {
    const id = p.nextIds.project++;
    p.projects.push({ ...entry, id });
  });
}
export function updateProject(id: number, entry: Omit<ProjectEntry, "id">) {
  return mutate((p) => {
    const idx = p.projects.findIndex((pr) => pr.id === id);
    if (idx >= 0) p.projects[idx] = { ...entry, id };
  });
}
export function deleteProject(id: number) {
  return mutate((p) => {
    p.projects = p.projects.filter((pr) => pr.id !== id);
  });
}

// ---- Certifications ----
export function addCertification(entry: Omit<CertificationEntry, "id">) {
  return mutate((p) => {
    const id = p.nextIds.certification++;
    p.certifications.push({ ...entry, id });
  });
}
export function updateCertification(id: number, entry: Omit<CertificationEntry, "id">) {
  return mutate((p) => {
    const idx = p.certifications.findIndex((c) => c.id === id);
    if (idx >= 0) p.certifications[idx] = { ...entry, id };
  });
}
export function deleteCertification(id: number) {
  return mutate((p) => {
    p.certifications = p.certifications.filter((c) => c.id !== id);
  });
}

/** True once the user has entered enough to make matching meaningful. */
export function isProfileUsable(p: CareerProfile): boolean {
  return p.employment.length > 0 || p.skills.length > 0 || p.projects.length > 0;
}
