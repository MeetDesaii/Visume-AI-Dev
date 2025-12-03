/* =======================
 * Resume DTOs
 * ======================= */

import { Job } from "./job";

/** Root resume JSON returned to clients */
export interface ResumeDTO {
  _id: string;
  owner?: string;
  job?: string;

  profiles: ProfilesDTO;
  resumeScore: ResumeScoreDTO;
  metadata: MetadataDTO;

  resumeName: string;
  targetJobTitle?: string;

  firstName: string;
  lastName: string;
  location?: string;

  email?: string;
  phoneNumber?: string;

  summary?: string;

  links: string[];

  projects: ProjectDTO[];
  educations: EducationDTO[];
  workExperiences: ExperienceDTO[];
  volunteerExperiences: ExperienceDTO[];

  certifications: CertificationDTO[];
  skills: SkillDTO[];
  skillsCategories: SkillCategoryDTO[];

  resumeSections: ResumeSectionDTO[];

  sourceInfo: SourceInfoDTO;

  createdAt: string;
  updatedAt: string;

  /** Virtuals (included because toJSON has virtuals=true) */
  fullName: string;
  totalExperienceMonths: number;
}

export interface ResumeWithOutJob extends Omit<ResumeDTO, "job"> {
  job: Job;
}

/* ---------- Simple subdocuments ---------- */

export interface ProfilesDTO {
  _id: string;
  linkedin?: string;
  github?: string;
}

export interface MetadataDTO {
  _id: string;
  pages?: number;
  fileSize?: number;
}

export interface SourceInfoDTO {
  _id: string;
  resumeName?: string;
  rawText?: string;
}

export interface SkillDTO {
  _id: string;
  name: string;
}

export interface SkillCategoryDTO {
  _id: string;
  categoryName: string;
  skills: SkillDTO[];
}

export interface ResumeSectionDTO {
  _id: string;
  sectionId: string;
  title: string;
}

/* ---------- Projects / Achievements ---------- */

export interface AchievementDTO {
  _id: string;
  text: string;
}

export interface AchievementWithVectorDTO {
  _id: string;
  text: string;
  /** Not selected by default in schema (select:false); include only if you project it */
  embedding?: number[];
}

export interface ProjectDTO {
  _id: string;
  title: string;
  description?: string;
  achievements: AchievementDTO[];
  /** simple string skills in projects */
  skills: string[];
}

/* ---------- Education ---------- */

export interface EducationDTO {
  _id: string;
  institutionName: string;
  degreeTypeName?: string;
  fieldOfStudyName?: string;
  /** Dates are serialized as ISO strings */
  graduationAt?: string;
  description?: string;
}

/* ---------- Experience ---------- */

export interface ExperienceDTO {
  _id: string;
  isCurrentPosition?: boolean;
  employerName: string;
  jobTitle: string;
  location?: string;
  startedAt?: string; // ISO
  endedAt?: string; // ISO
  role?: string;
  achievements: AchievementDTO[];
  skills: string[];
}

// types/resume.dto.ts
export interface CertificationDTO {
  _id: string;
  title: string;
  issuer?: string;
  startDate?: string; // ISO
  expiryDate?: string; // ISO
  link?: string;
}

/* ---------- Score / Meta ---------- */

export interface SectionCompletionDTO {
  _id: string;
  missingFields: string[];
  score: number; // 0..1
  finishedScoring?: boolean;
}

export interface ContentLengthDTO {
  _id: string;
  score: number; // 0..1
  pros?: string;
  cons?: string;
  finishedScoring?: boolean;
}

export interface ResumeScoreDTO {
  _id: string;
  sectionCompletion: SectionCompletionDTO;
  contentLength: ContentLengthDTO;
  score: number; // 0..1
}
