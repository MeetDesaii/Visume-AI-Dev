import { ObjectId, Timestamps } from "./common";
import { ResumeDTO } from "./resume";

export type GithubProjectVerificationStatus =
  | "MATCHED"
  | "NOT_FOUND"
  | "FAILED";

export interface GithubProjectVerificationDTO {
  _id: ObjectId;
  projectTitle: string;
  repoName?: string;
  repoUrl?: string;
  status: GithubProjectVerificationStatus;
  matchConfidence: number;
  matchReasoning: string;
  repoSummary: string;
  supportedClaims: string[];
  missingClaims: string[];
  riskFlags: string[];
  alignmentScore: number;
}

export interface GithubVerificationDTO extends Timestamps {
  _id: ObjectId;
  owner?: ObjectId;
  resume: ObjectId | ResumeDTO;
  githubProfileUrl: string;
  profileMarkdown?: string;
  projectResults: GithubProjectVerificationDTO[];
  status: "PENDING" | "COMPLETED" | "FAILED";
  overallScore: number;
  runMetadata?: Record<string, unknown>;
}

export interface GithubVerificationResponse {
  success: boolean;
  data: GithubVerificationDTO;
}
