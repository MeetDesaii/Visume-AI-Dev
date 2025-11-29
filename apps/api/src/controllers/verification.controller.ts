import { NextFunction, Request, Response } from "express";
import {
  LinkedInProfile as LinkedInProfileModel,
  Resume,
  ResumeVerification,
} from "@visume/database";
import { runResumeLinkedInVerification } from "@visume/ai-core";
import { extractTextFromBuffer } from "@visume/lib";
import {
  ResumeVerificationResponse,
  ResumeVerificationsResponse,
  VerifiedResumesResponse,
} from "@visume/types";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { isValidMongoId, transformLinkedInProfileForDB } from "../lib";
import { logger } from "../utils/logger";

export const verifyResumeWithLinkedIn = asyncHandler(
  async (
    req: Request,
    res: Response<ResumeVerificationResponse>,
    next: NextFunction
  ) => {
    const resumeId = req.body.resumeId;
    const linkedinFile = req.file;
    const userId = req.user?._id;

    if (!userId) {
      return next(new AppError(401, "User not found"));
    }
    if (!linkedinFile) {
      return next(new AppError(400, "LinkedIn PDF is required"));
    }
    if (!resumeId || !isValidMongoId(resumeId)) {
      return next(new AppError(400, "A valid resumeId is required"));
    }

    const resume = await Resume.findOne({ _id: resumeId, owner: userId });
    if (!resume) {
      return next(new AppError(404, "Resume not found for this user"));
    }

    const parsedPdf = await extractTextFromBuffer(
      linkedinFile.originalname,
      linkedinFile.buffer
    );

    if (!parsedPdf.success) {
      return next(
        new AppError(400, parsedPdf.error ?? "Unable to read LinkedIn PDF")
      );
    }

    const verificationResult = await runResumeLinkedInVerification({
      resume: resume.toObject() as any,
      linkedinPdfText: parsedPdf.text,
    });

    const linkedinProfileDoc = await LinkedInProfileModel.create({
      owner: userId,
      resume: resume._id,
      ...transformLinkedInProfileForDB(verificationResult.linkedinProfile),
      rawText: parsedPdf.text,
      sourceFileName: linkedinFile.originalname,
      sourceFileSize: linkedinFile.size,
      sourceFormat: parsedPdf.format,
    });

    const verificationDoc = await ResumeVerification.create({
      owner: userId,
      resume: resume._id,
      linkedinProfile: linkedinProfileDoc._id,
      status: "COMPLETED",
      findings: verificationResult.findings,
      resumeAssertions: verificationResult.resumeAssertions,
      sectionScores: verificationResult.sectionScores,
      overallScore: verificationResult.overallScore,
      scoringMethod: verificationResult.scoringMethod,
      runMetadata: {
        linkedinFormat: parsedPdf.format,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        verification: verificationDoc,
        linkedinProfile: linkedinProfileDoc,
      } as any,
    });
  }
);

export const getResumeVerifications = asyncHandler(
  async (
    req: Request,
    res: Response<ResumeVerificationsResponse>,
    next: NextFunction
  ) => {
    const userId = req.user?._id;
    const resumeId = req.params.resumeId;

    if (!userId) return next(new AppError(401, "User not found"));

    if (!resumeId || !isValidMongoId(resumeId))
      return next(new AppError(400, "A valid resumeId is required"));

    const verifications = await ResumeVerification.findOne({
      owner: userId,
      resume: resumeId,
    })
      .populate("linkedinProfile")
      .populate("resume")
      .sort({ createdAt: -1 });

    logger.debug(verifications);

    res.status(200).json({
      success: true,
      data: verifications as any,
    });
  }
);

export const getAllVerifiedResumes = asyncHandler(
  async (
    req: Request,
    res: Response<VerifiedResumesResponse>,
    next: NextFunction
  ) => {
    const userId = req.user?._id;

    if (!userId) return next(new AppError(401, "User not found"));

    const verifications = await ResumeVerification.find({ owner: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "resume",
        select: "resumeName summary sourceInfo createdAt",
      })
      .populate({
        path: "linkedinProfile",
        select: "firstName lastName headline sourceFileName sourceFormat",
      });

    res.status(200).json({
      success: true,
      data: verifications as any,
    });
  }
);
