import type { ApiResponse } from "./common";
import type { User } from "../models/user";

export type VerifySessionUser = Pick<
  User,
  "_id" | "email" | "firstName" | "lastName" | "subscription"
>;

export type VerifySessionResponse = ApiResponse<{ user: VerifySessionUser }>;

export type WebhookAckResponse = ApiResponse<{ received: true }>;
