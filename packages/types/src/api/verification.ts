import type { ApiSuccessResponse } from "./common";
import type {
  LinkedInProfileDTO,
  LinkedInProfileSummaryDTO,
  ResumeSummaryDTO,
  ResumeVerificationDTO,
} from "../models/verification";
import type { GithubVerificationDTO } from "../models/github-verification";

export type ResumeVerificationResponse = ApiSuccessResponse<{
  verification: ResumeVerificationDTO;
  linkedinProfile: LinkedInProfileDTO;
}>;

export type ResumeVerificationsResponse =
  ApiSuccessResponse<ResumeVerificationDTO | null>;

export type VerifiedResumesResponse = ApiSuccessResponse<
  Array<
    Omit<ResumeVerificationDTO, "resume" | "linkedinProfile"> & {
      resume: ResumeSummaryDTO | string;
      linkedinProfile: LinkedInProfileSummaryDTO | string;
    }
  >
>;

export type GithubVerificationResponse =
  ApiSuccessResponse<GithubVerificationDTO>;
