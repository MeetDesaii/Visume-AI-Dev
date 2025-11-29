import { LinkedInProfile, ResumeExtraction } from "@visume/ai-core";
import { convertStringToDate } from "../utils";
import mongoose from "mongoose";

export function transformAIResponseForDB(
  aiResponse: ResumeExtraction
): ResumeExtraction {
  return {
    ...aiResponse,
    workExperiences: aiResponse.workExperiences.map((exp) => ({
      ...exp,
      startedAt: convertStringToDate(exp.startedAt),
      endedAt: convertStringToDate(exp.endedAt),
    })),
    volunteerExperiences: aiResponse.volunteerExperiences.map((exp) => ({
      ...exp,
      startedAt: convertStringToDate(exp.startedAt),
      endedAt: convertStringToDate(exp.endedAt),
    })),
    educations: aiResponse.educations.map((edu) => ({
      ...edu,
      graduationAt: convertStringToDate(edu.graduationAt),
    })),
    certifications: aiResponse.certifications.map((cert) => ({
      ...cert,
      startDate: convertStringToDate(cert.startDate),
      expiryDate: convertStringToDate(cert.expiryDate),
    })),
  } as unknown as ResumeExtraction;
}

export function isValidMongoId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export function transformLinkedInProfileForDB(
  profile: LinkedInProfile
): LinkedInProfile {
  return {
    ...profile,
    experiences: profile.experiences.map((exp) => ({
      ...exp,
      startedAt: convertStringToDate(exp.startedAt),
      endedAt: convertStringToDate(exp.endedAt),
    })),
    educations: profile.educations.map((edu) => ({
      ...edu,
      graduationAt: convertStringToDate(edu.graduationAt),
    })),
    certifications: profile.certifications.map((cert) => ({
      ...cert,
      startDate: convertStringToDate(cert.startDate),
      expiryDate: convertStringToDate(cert.expiryDate),
    })),
  } as unknown as LinkedInProfile;
}
