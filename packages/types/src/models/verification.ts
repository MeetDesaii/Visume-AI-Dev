import { ObjectId, Timestamps } from "./common";
import { ResumeDTO } from "./resume";

export interface LinkedInExperienceDTO {
  _id: ObjectId;
  title: string;
  companyName: string;
  location?: string;
  startedAt?: string | null;
  endedAt?: string | null;
  description?: string;
  achievements: string[];
  skills: string[];
}

export interface LinkedInEducationDTO {
  _id: ObjectId;
  institutionName: string;
  degreeTypeName?: string;
  fieldOfStudyName?: string;
  graduationAt?: string | null;
  description?: string;
}

export interface LinkedInCertificationDTO {
  _id: ObjectId;
  title: string;
  issuer?: string;
  startDate?: string | null;
  expiryDate?: string | null;
  credentialUrl?: string;
}

export interface LinkedInProfileDTO extends Timestamps {
  _id: ObjectId;
  owner?: ObjectId;
  resume?: ObjectId;
  firstName: string;
  lastName: string;
  headline?: string;
  about?: string;
  location?: string;
  email?: string;
  phone?: string;
  websites: string[];
  experiences: LinkedInExperienceDTO[];
  educations: LinkedInEducationDTO[];
  certifications: LinkedInCertificationDTO[];
  skills: string[];
  languages: string[];
  accomplishments: string[];
  rawText?: string;
  sourceFileName?: string;
  sourceFileSize?: number;
  sourceFormat?: string;
}

export interface VerificationSectionScoreDTO {
  _id: ObjectId;
  section: string;
  score: number; // 0-100
  weight: number; // 0-1
  rationale?: string;
  coverage?: number;
}

export interface ResumeVerificationDTO extends Timestamps {
  _id: ObjectId;
  owner?: ObjectId;
  resume: ObjectId | ResumeDTO;
  linkedinProfile: ObjectId | LinkedInProfileDTO;
  status: "PENDING" | "COMPLETED" | "FAILED";
  findings: string[];
  resumeAssertions: string[];
  sectionScores: VerificationSectionScoreDTO[];
  overallScore: number;
  scoringMethod?: string;
  runMetadata?: Record<string, unknown>;
}

export interface ResumeVerificationResponse {
  success: boolean;
  data: {
    verification: ResumeVerificationDTO;
    linkedinProfile: LinkedInProfileDTO;
  };
}

export interface ResumeVerificationsResponse {
  success: boolean;
  data: ResumeVerificationDTO;
}

export type ResumeSummaryDTO = Pick<
  ResumeDTO,
  "_id" | "resumeName" | "summary" | "sourceInfo"
>;

export type LinkedInProfileSummaryDTO = Pick<
  LinkedInProfileDTO,
  "_id" | "firstName" | "lastName" | "headline" | "sourceFileName"
>;

export interface VerifiedResumesResponse {
  success: boolean;
  data: Array<
    Omit<ResumeVerificationDTO, "resume" | "linkedinProfile"> & {
      resume: ResumeSummaryDTO | ObjectId;
      linkedinProfile: LinkedInProfileSummaryDTO | ObjectId;
    }
  >;
}
