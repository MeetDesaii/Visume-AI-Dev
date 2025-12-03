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

    if (!userId) return next(new AppError(401, "User not found"));
    if (!linkedinFile)
      return next(new AppError(400, "LinkedIn PDF is required"));
    if (!resumeId || !isValidMongoId(resumeId))
      return next(new AppError(400, "A valid resumeId is required"));

    const resume = await Resume.findOne({ _id: resumeId, owner: userId });
    if (!resume)
      return next(new AppError(404, "Resume not found for this user"));

    const parsedPdf = await extractTextFromBuffer(
      linkedinFile.originalname,
      linkedinFile.buffer
    );

    if (!parsedPdf.success)
      return next(
        new AppError(400, parsedPdf.error ?? "Unable to read LinkedIn PDF")
      );

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

      // Store the beautiful markdown report directly.
      // Ensure Schema is: findings: { type: String }
      findings: verificationResult.findings,

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
        verification: verificationDoc.toObject() as any,
        linkedinProfile: linkedinProfileDoc.toObject() as any,
      } as any,
    });
  }
);

<<<<<<< Updated upstream
=======
export const verifyResumeWithGithub = asyncHandler(
  async (
    req: Request,
    res: Response<GithubVerificationResponse>,
    next: NextFunction
  ) => {
    const resumeId = req.body.resumeId;
    const providedGithubUrl = (req.body.githubProfileUrl as string) ?? "";
    const userId = req.user?._id;

    if (!userId) return next(new AppError(401, "User not found"));

    if (!resumeId || !isValidMongoId(resumeId)) {
      return next(new AppError(400, "A valid resumeId is required"));
    }

    const resume = await Resume.findOne({ _id: resumeId, owner: userId });
    if (!resume) {
      return next(new AppError(404, "Resume not found for this user"));
    }

    const githubProfileUrl =
      providedGithubUrl.trim() ||
      resume.profiles?.github ||
      (resume.links || []).find(
        (link) =>
          typeof link === "string" && link.toLowerCase().includes("github.com")
      ) ||
      "";

    if (!githubProfileUrl) {
      return next(
        new AppError(
          400,
          "GitHub profile link is required on the resume or request body"
        )
      );
    }

    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlApiKey) {
      return next(new AppError(500, "FIRECRAWL_API_KEY is not configured"));
    }

    try {
      const verificationResult = await runResumeGithubVerification({
        resume: resume.toObject() as any,
        githubProfileUrl,
        firecrawlApiKey,
      });

      const verificationDoc = await GithubVerification.create({
        owner: userId,
        resume: resume._id,
        githubProfileUrl: verificationResult.githubProfileUrl,
        profileMarkdown: verificationResult.profileMarkdown,
        projectResults: verificationResult.projectResults,
        status: "COMPLETED",
        overallScore: verificationResult.overallScore,
        runMetadata: verificationResult.runMetadata,
      });

      res.status(200).json({
        success: true,
        data: verificationDoc.toObject() as any,
      });
    } catch (error) {
      logger.error(error, "GitHub verification failed");
      return next(
        new AppError(
          500,
          (error as Error)?.message ?? "Unable to verify GitHub projects"
        )
      );
    }
  }
);

>>>>>>> Stashed changes
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
      data: (verifications ? verifications.toObject() : null) as any,
    });
  }
);

<<<<<<< Updated upstream
=======
export const getGithubVerifications = asyncHandler(
  async (
    req: Request,
    res: Response<GithubVerificationResponse>,
    next: NextFunction
  ) => {
    const userId = req.user?._id;
    const resumeId = req.params.resumeId;

    if (!userId) return next(new AppError(401, "User not found"));
    if (!resumeId || !isValidMongoId(resumeId)) {
      return next(new AppError(400, "A valid resumeId is required"));
    }

    const verification = await GithubVerification.findOne({
      owner: userId,
      resume: resumeId,
    }).sort({ createdAt: -1 });

    if (!verification) {
      return next(new AppError(404, "No GitHub verification found"));
    }

    res.status(200).json({
      success: true,
      data: (verification ? verification.toObject() : null) as any,
    });
  }
);

>>>>>>> Stashed changes
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
      data: verifications.map((verification) => verification.toObject()) as any,
    });
  }
);
