import type { ApiSuccessResponse } from "./common";
import type { ResumeDTO, ResumeWithOutJob } from "../models/resume";
import type { ResumeReview } from "../models/resume-review";

export type ResumeExtractionResponse = ApiSuccessResponse<{
  resume: ResumeDTO;
}>;

export type ResumeListResponse = ApiSuccessResponse<{
  resumes: ResumeDTO[];
}>;

export type ResumeDetailResponse = ApiSuccessResponse<{
  resume: ResumeWithOutJob;
}>;

export type ResumeTailorResponse = ApiSuccessResponse<{
  review: ResumeReview;
}>;

export type ResumeReviewLookupResponse = ApiSuccessResponse<{
  review: ResumeReview | null;
}>;

export interface UploadResumeResponse {
  resume: {
    filename: string;
    id: string;
    originalName: string;
    s3Url: string;
    uploadedAt: string | Date;
    rawText: string;
  };
}
