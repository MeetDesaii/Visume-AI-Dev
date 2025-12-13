import { NextFunction, Request, Response } from "express";
import {
  LinkedInProfile as LinkedInProfileModel,
  Resume,
  ResumeVerification,
  GithubVerification,
} from "@visume/database";
import {
  runResumeGithubVerification,
  runResumeLinkedInVerification,
} from "@visume/ai-core";
import { extractTextFromBuffer } from "@visume/lib";
import {
  GithubVerificationResponse,
  ResumeVerificationResponse,
  ResumeVerificationsResponse,
  VerifiedResumesResponse,
} from "@visume/types";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { isValidMongoId, transformLinkedInProfileForDB } from "../lib";
import { logger } from "../utils/logger";
import config from "../config/env";

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

export const verifyResumeWithGithub = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { resumeId, githubProfileUrl: providedUrl } = req.body;
    const userId = req.user?._id;

    // 1. Basic Validation
    if (!userId) return next(new AppError(401, "User not found"));
    if (!resumeId || !isValidMongoId(resumeId)) {
      return next(new AppError(400, "A valid resumeId is required"));
    }

    // 2. Fetch Resume (Read-only optimization with .lean())
    const resume = await Resume.findOne({
      _id: resumeId,
      owner: userId,
    }).lean();

    if (!resume) {
      return next(new AppError(404, "Resume not found"));
    }

    // 3. Resolve GitHub URL (Priority: Body -> Resume Profile -> Resume Links)
    let targetGithubUrl = providedUrl?.trim();

    if (!targetGithubUrl) {
      // Check resume.profiles object
      if (resume.profiles?.github) {
        targetGithubUrl = resume.profiles.github;
      }
      // Fallback: Search inside links array
      else if (Array.isArray(resume.links)) {
        const githubLink = resume.links.find(
          (link) =>
            typeof link === "string" &&
            link.toLowerCase().includes("github.com")
        );
        if (githubLink) targetGithubUrl = githubLink;
      }
    }

    if (!targetGithubUrl) {
      return next(
        new AppError(400, "No GitHub profile URL found in request or resume.")
      );
    }

    // 4. CACHE CHECK: Check if we verified this recently (e.g., last 24 hours)
    // This prevents abuse and saves Firecrawl credits.
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const cachedVerification = await GithubVerification.findOne({
      resume: resumeId,
      githubProfileUrl: targetGithubUrl, // Ensure it matches the requested URL
      status: "COMPLETED",
      createdAt: { $gt: oneDayAgo }, // Only fresh results
    }).lean();

    if (cachedVerification) {
      logger.info(
        `[GithubVerify] Returning cached result for resume ${resumeId}`
      );
      return res.status(200).json({
        success: true,
        data: cachedVerification,
        message: "Retrieved from cache",
      });
    }

    // 5. Config Check
    const firecrawlApiKey = config.firecrawlApiKey;
    if (!firecrawlApiKey) {
      return next(
        new AppError(500, "Server configuration error: Missing API Key")
      );
    }

    // 6. Run the Agent (This takes time)
    // Note: If this takes > 60s, you might need a background job queue (BullMQ).
    try {
      const result = await runResumeGithubVerification({
        resume: resume as any, // Cast because lean() returns POJO
        githubProfileUrl: targetGithubUrl,
        firecrawlApiKey,
      });

      // 7. Save Result
      const verificationDoc = await GithubVerification.create({
        owner: userId,
        resume: resumeId,
        githubProfileUrl: result.githubProfileUrl,
        profileMarkdown: result.profileMarkdown, // Consider removing this if DB space is tight
        projectResults: result.projectResults,
        status: "COMPLETED",
        overallScore: result.overallScore,
        runMetadata: result.runMetadata,
      });

      return res.status(200).json({
        success: true,
        data: verificationDoc,
      });
    } catch (error) {
      logger.error(error, `[GithubVerify] Failed for resume ${resumeId}`);

      // Save a "FAILED" record so we know it broke
      await GithubVerification.create({
        owner: userId,
        resume: resumeId,
        githubProfileUrl: targetGithubUrl,
        status: "FAILED",
        runMetadata: { error: (error as Error).message },
      });

      return next(
        new AppError(502, `Verification failed: ${(error as Error).message}`)
      );
    }
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
      data: (verifications ? verifications.toObject() : null) as any,
    });
  }
);

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
