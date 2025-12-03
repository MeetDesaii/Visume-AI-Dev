import type { ApiSuccessResponse } from "./common";
import type { Job } from "../models/job";

export interface JobDTO extends Job {
  _id: string;
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateJobPayload {
  title: string;
  description: string;
  company: string;
}

export type CreateJobResponse = ApiSuccessResponse<{ job: JobDTO }>;
