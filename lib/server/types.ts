// Shared data-model types for the JSON-file store. These mirror what would have
// been a SQL schema — kept here as the single source of truth for shapes that
// span multiple collections (profile entries referenced by evidence citations,
// match classifications, etc).

export type ProfileTable =
  | "employment_highlights"
  | "skills"
  | "skill_evidence"
  | "education"
  | "projects"
  | "certifications";

export interface ProfileEntryRef {
  table: ProfileTable;
  id: number;
}

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  website: string;
}

export interface EducationEntry {
  id: number;
  institution: string;
  degree: string;
  subject: string;
  grade: string;
  startDate: string;
  endDate: string;
  modules: string;
  projects: string;
}

export type HighlightType = "responsibility" | "achievement" | "technology" | "project";

export interface EmploymentHighlight {
  id: number;
  type: HighlightType;
  text: string;
}

export interface EmploymentEntry {
  id: number;
  company: string;
  jobTitle: string;
  location: string;
  startDate: string;
  endDate: string;
  highlights: EmploymentHighlight[];
}

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type EvidenceSource = "university" | "employment" | "personal_project" | "certification";

export interface SkillEvidence {
  id: number;
  text: string;
  where: EvidenceSource;
  verified: boolean;
}

export interface SkillEntry {
  id: number;
  name: string;
  level: SkillLevel;
  evidence: SkillEvidence[];
}

export interface ProjectEntry {
  id: number;
  name: string;
  description: string;
  technologies: string;
  responsibilities: string;
  results: string;
  metrics: string;
  links: string;
}

export interface CertificationEntry {
  id: number;
  name: string;
  organisation: string;
  date: string;
  expiryDate: string;
  certificateNumber: string;
}

export interface CareerProfile {
  personalInfo: PersonalInfo;
  education: EducationEntry[];
  employment: EmploymentEntry[];
  skills: SkillEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  version: number;
  nextIds: Record<
    "education" | "employment" | "highlight" | "skill" | "evidence" | "project" | "certification",
    number
  >;
}

export type ImportSuggestionStatus = "pending" | "applied" | "dismissed" | "partially_applied";

export interface ProfileImportSuggestion {
  id: number;
  /** Null when the suggestion came from a one-off file upload on the Career Profile page
   * rather than a persisted CV in "My CVs" — nothing to reference in that case. */
  cvId: number | null;
  suggestedJson: unknown;
  status: ImportSuggestionStatus;
  appliedJson: unknown | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AtsIssue {
  severity: "info" | "warning" | "risk";
  title: string;
  whatIsWorking: string | null;
  whatCouldCauseProblems: string | null;
  howToFix: string | null;
}

export interface CvStructureAnalysis {
  atsScore: number;
  atsRisk: "low" | "medium" | "high";
  issues: AtsIssue[];
  sectionsDetected: string[];
  hasTextLayer: boolean;
}

export interface CvRecord {
  id: number;
  name: string;
  fileName: string;
  mimeType: string;
  rawText: string;
  extractionWarnings: string[];
  structureJson: CvStructureAnalysis | null;
  createdAt: string;
}

export type RequirementCategory =
  | "required_skill"
  | "preferred_skill"
  | "responsibility"
  | "qualification"
  | "experience"
  | "soft_skill"
  | "keyword";

export interface JobRequirementItem {
  id: number;
  category: RequirementCategory;
  text: string;
  keywords: string[];
}

export interface JobDescription {
  id: number;
  title: string;
  company: string;
  rawText: string;
  sourceType: "paste" | "upload" | "image";
  requirementItems: JobRequirementItem[];
  extractedAt: string | null;
  createdAt: string;
}

export type MatchType = "strong" | "partial" | "underdeveloped" | "missing" | "unknown";

export type MatchCategory =
  | "required_skills"
  | "preferred_skills"
  | "experience"
  | "education"
  | "responsibilities"
  | "keywords"
  | "achievements";

export interface MatchItem {
  requirementItemId: number;
  category: MatchCategory;
  requirementText: string;
  matchType: MatchType;
  evidenceText: string | null;
  evidenceRef: ProfileEntryRef | null;
  notes: string | null;
}

export interface MatchAnalysis {
  id: number;
  jobDescriptionId: number;
  profileVersionAtRun: number;
  inputHash: string;
  overallScore: number;
  atsScore: number | null;
  categoryScores: Record<MatchCategory, number | null>;
  matchItems: MatchItem[];
  createdAt: string;
}

export interface IdealCvBlueprint {
  id: number;
  jobDescriptionId: number;
  structure: string[];
  summaryExample: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceExpectations: string[];
  achievementExamplePatterns: string[];
  createdAt: string;
}

export interface EmbeddingRecord {
  id: number;
  ownerType: string;
  ownerId: number;
  text: string;
  textHash: string;
  vector: number[];
  model: string;
  createdAt: string;
}

export interface AiGenerationLogEntry {
  id: number;
  kind:
    | "profile_suggestion"
    | "requirement_extraction"
    | "match_classification"
    | "blueprint"
    | "cv_generation"
    | "cover_letter"
    | "interview_questions"
    | "interview_feedback";
  refTable: string | null;
  refId: number | null;
  model: string;
  prompt: string;
  rawResponse: string;
  parsedOk: boolean;
  retryCount: number;
  durationMs: number;
  createdAt: string;
}

export interface Settings {
  ollamaUrl: string;
  reasoningModel: string;
  embeddingModel: string;
  visionModel: string;
}

// ---- Phase 2: CV Builder ----

export type CvTemplate = "traditional" | "modern" | "technical" | "academic" | "graduate" | "executive";

export type CvSectionType = "summary" | "skills" | "experience" | "projects" | "education" | "certifications";

/** Every bullet either cites a real profile entry, or is null only for structural/connective text. */
export interface CvBulletContent {
  text: string;
  evidenceRef: ProfileEntryRef | null;
}

export interface CvExperienceItem {
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: CvBulletContent[];
}

export interface CvEducationItem {
  institution: string;
  degree: string;
  subject: string;
  grade: string;
  startDate: string;
  endDate: string;
}

export interface CvProjectItem {
  name: string;
  description: string;
  technologies: string;
}

export interface CvCertificationItem {
  name: string;
  organisation: string;
  date: string;
}

export interface CvBuildContent {
  personalInfo: PersonalInfo;
  summary: string;
  skills: string[];
  experience: CvExperienceItem[];
  projects: CvProjectItem[];
  education: CvEducationItem[];
  certifications: CvCertificationItem[];
  sectionOrder: CvSectionType[];
}

export type CvGenerationMode = "improve" | "tailor" | "from_profile";

export interface CvBuild {
  id: number;
  name: string;
  template: CvTemplate;
  mode: CvGenerationMode;
  sourceCvId: number | null;
  jobDescriptionId: number | null;
  content: CvBuildContent;
  createdAt: string;
  updatedAt: string;
}

// ---- Phase 2: Cover letters / supporting statements ----

export type GeneratedDocumentType =
  | "cover_letter"
  | "supporting_statement"
  | "personal_statement"
  | "recruiter_message";

export interface GeneratedDocument {
  id: number;
  type: GeneratedDocumentType;
  jobDescriptionId: number | null;
  content: string;
  wordCount: number;
  style: string;
  maxWords: number | null;
  createdAt: string;
}

// ---- Phase 2: Interview preparation ----

export type InterviewQuestionCategory = "behavioral" | "technical" | "situational" | "general";

export interface StarAnswer {
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface InterviewQuestion {
  id: number;
  question: string;
  category: InterviewQuestionCategory;
  starAnswer: StarAnswer | null;
}

export interface InterviewFeedback {
  relevance: string;
  clarity: string;
  structure: string;
  evidence: string;
  missingDetails: string;
}

export interface MockInterviewTurn {
  questionId: number;
  question: string;
  answer: string;
  feedback: InterviewFeedback | null;
}

export interface InterviewSession {
  id: number;
  jobDescriptionId: number;
  questions: InterviewQuestion[];
  mockTurns: MockInterviewTurn[];
  createdAt: string;
}

// ---- Phase 2: Application tracker ----

export type ApplicationStatus =
  | "interested"
  | "preparing"
  | "applied"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

export interface Application {
  id: number;
  company: string;
  jobTitle: string;
  jobDescriptionId: number | null;
  dateApplied: string | null;
  cvBuildId: number | null;
  coverLetterId: number | null;
  status: ApplicationStatus;
  interviewDate: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Background jobs: long-running AI calls that keep running server-side
// regardless of navigation, so the user never loses work by switching pages. ----

export type BackgroundJobKind =
  | "cv_build_generate"
  | "job_extract"
  | "job_match"
  | "job_blueprint"
  | "document_generate"
  | "interview_questions"
  | "interview_star"
  | "interview_mock_feedback"
  | "profile_import_suggestion";

export type BackgroundJobStatus = "running" | "done" | "error";

export interface BackgroundJobResultRef {
  table: string;
  id: number;
}

export interface BackgroundJob {
  id: number;
  kind: BackgroundJobKind;
  label: string;
  refTable: string | null;
  refId: number | null;
  status: BackgroundJobStatus;
  resultRef: BackgroundJobResultRef | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}
