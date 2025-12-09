import {
  RESUME_EXTRACTION_SYSTEM_PROMPT,
  ResumeExtractionSchema,
  ResumeReviewSchema,
  structuredExtract,
  tailorResumeContent,
} from "@visume/ai-core";
import { NextFunction, Request, Response } from "express";
import { extractTextFromBuffer } from "@visume/lib";
import { Resume, ResumeReview, Suggestion } from "@visume/database";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { isValidMongoId, transformAIResponseForDB } from "../lib";
import {
  ResumeReviewStatus,
  ResumeDetailResponse,
  ResumeExtractionResponse,
  ResumeListResponse,
  ResumeReviewLookupResponse,
  ResumeTailorResponse,
} from "@visume/types";

export const extractResumeInfo = asyncHandler(
  async (
    req: Request,
    res: Response<ResumeExtractionResponse>,
    next: NextFunction,
  ) => {
    const resume = req.file;
    // const { jobId } = req.body;
    const jobId = req.body.jobId;
    const userId = req.user?._id;
    if (!resume) {
      return next(new AppError(400, "No resume file found"));
    }
    if (!userId) {
      return next(new AppError(401, "No user found"));
    }

    if (!jobId) {
      return next(new AppError(400, "No Job ID found"));
    }

    const data = await extractTextFromBuffer(
      resume.originalname,
      resume.buffer,
    );
    if (!data.success) {
      return next(
        new AppError(400, "Error when extracting content from the file!"),
      );
    }

    const extractedText = data.text;

    // const result = demoResume;

    const result = await structuredExtract({
      schema: ResumeExtractionSchema,
      input: [
        { role: "system", content: RESUME_EXTRACTION_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Extract information from this resume:\n\n${extractedText}`,
        },
      ],
      model: "gpt-4.1-2025-04-14",
    });

    if (!result) {
      return next(new AppError(400, "Error: openai request failed"));
    }

    const validated = ResumeExtractionSchema.safeParse(result);
    if (validated.success) {
      let dbData = transformAIResponseForDB(validated.data);

      const newResume = await Resume.create({
        ...dbData,
        owner: userId,
        job: jobId,

        metadata: {
          fileSize: resume.size,
        },
        sourceInfo: {
          resumeName: resume.originalname,
          rawText: extractedText,
        },
      });

      res.json({
        success: true,
        data: {
          resume: newResume.toObject() as any,
        },
      });
    } else {
      return next(new AppError(400, validated.error.message));
    }
  },
);

export const getAllResumes = asyncHandler(
  async (
    req: Request,
    res: Response<ResumeListResponse>,
    next: NextFunction,
  ) => {
    const userId = req.user?._id;

    if (!userId)
      return next(new AppError(401, `Unauthorized UserID: ${userId}`));

    const resumes = await Resume.find({
      owner: userId,
    })
      .select(
        "firstName lastName fullName email phoneNumber resumeName sourceInfo summary location profiles resumeScore metadata createdAt updatedAt",
      )
      .lean({ virtuals: true });

    if (!resumes) return next(new AppError(400, "No resume found!"));

    res.status(200).json({
      success: true,
      data: {
        resumes: resumes as any[],
      },
    });
  },
);

export const getResume = asyncHandler(
  async (
    req: Request,
    res: Response<ResumeDetailResponse>,
    next: NextFunction,
  ) => {
    const resumeId = req.params.resumeId;
    const userId = req.user?._id;
    if (!resumeId) return next(new AppError(400, "No resume ID found!"));
    if (!userId) return next(new AppError(401, "User not found"));

    const resume = await Resume.findOne({
      _id: resumeId,
      owner: userId,
    })
      .populate("job")
      .lean({ virtuals: true });

    if (!resume) return next(new AppError(400, "Resume not found."));

    res.status(200).json({
      success: true,
      data: {
        resume: resume as any,
      },
    });
  },
);

export const tailorResume = asyncHandler(
  async (
    req: Request,
    res: Response<ResumeTailorResponse>,
    next: NextFunction,
  ) => {
    const { resumeId } = req.params;
    const userId = req.user?._id;

    if (!resumeId) return next(new AppError(400, "Provide a resumeId"));
    if (!userId) return next(new AppError(401, "User not found resumeId"));
    if (!isValidMongoId(resumeId))
      return next(
        new AppError(400, "Provided resumeId is not a valid mongodb ID"),
      );

    const startTime = new Date();

    const resume = await Resume.findById(resumeId).populate("job");
    if (!resume || !resume.job) next(new AppError(400, "No resume found!"));

    const pendingReview = new ResumeReview({
      owner: userId,
      resume: resumeId,
      summary: "",
      startedAt: startTime,
      finishedAt: startTime,
      suggestions: [],
    });

    await pendingReview.save();

    const resumeData = JSON.stringify(resume, null, 2);
    const jobDescription = (resume?.job as any).description;

    const data = await tailorResumeContent({ jobDescription, resumeData });

    const validated = ResumeReviewSchema.safeParse(data);

    if (!validated.success)
      return next(
        new AppError(
          400,
          "The return data is not structed as needed! Try again",
        ),
      );

    const suggestionDocs = await Suggestion.insertMany(
      validated.data.suggestions.map((s: any) => ({
        resumeReview: pendingReview._id,
        title: s.title,
        description: s.description,
        operation: {
          action: s.operation.action,
          actual: s.operation.actual ?? "",
          value: s.operation.value ?? "",
        },
        priority: s.priority,
        path: s.path,
        documentPath: s.documentPath,
        sectionName: s.sectionName,
        acceptanceStatus: s.acceptanceStatus || "PENDING",
      })),
    );

    const finishTime = new Date();

    pendingReview.summary = validated.data.summary;
    pendingReview.suggestions = suggestionDocs.map((s) => s._id);
    pendingReview.status = ResumeReviewStatus.COMPLETED;
    pendingReview.finishedAt = finishTime;

    const completedReview = await pendingReview.save();

    res.status(200).json({
      success: true,
      data: {
        review: completedReview.toObject() as any,
      },
    });
  },
);

export const getResumeReview = asyncHandler(
  async (
    req: Request,
    res: Response<ResumeReviewLookupResponse>,
    next: NextFunction,
  ) => {
    const { resumeId } = req.params;
    console.log("🚀 ~ resumeId:", resumeId);
    const userId = req.user?._id;
    console.log("🚀 ~ userId:", userId);

    if (!resumeId) return next(new AppError(400, "Provide a resumeId"));
    if (!userId) return next(new AppError(401, "User not found resumeId"));
    if (!isValidMongoId(resumeId))
      return next(
        new AppError(400, "Provided resumeId is not a valid mongodb ID"),
      );

    const resumeReview = await ResumeReview.findOne({
      resume: resumeId,
      owner: userId,
    }).populate("suggestions");

    if (!resumeReview) {
      res.status(200).json({
        success: true,
        data: {
          review: null,
        },
      });
    } else {
      res.status(200).json({
        success: true,
        data: {
          review: resumeReview.toObject() as any,
        },
      });
    }
  },
);
