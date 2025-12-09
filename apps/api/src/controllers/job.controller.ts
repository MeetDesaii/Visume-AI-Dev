import { NextFunction, Request, Response } from "express";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import {
  KEYWORD_EXTRACTION_SYSTEM_PROMPT,
  KeywordExtractionSchema,
  structuredExtract,
} from "@visume/ai-core";
import {} from "@visume/ai-core";
import { Job } from "@visume/database";
import { CreateJobPayload, CreateJobResponse } from "@visume/types";

export const createJob = asyncHandler(
  async (
    req: Request,
    res: Response<CreateJobResponse>,
    next: NextFunction,
  ) => {
    const { description, title, company } = req.body.job as CreateJobPayload;
    const userId = req.user?._id;

    if (!userId) {
      return next(new AppError(401, "No user found"));
    }

    const result = await structuredExtract({
      schema: KeywordExtractionSchema,
      input: [
        { role: "system", content: KEYWORD_EXTRACTION_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Extract keywords from this job description:\n\n${description}`,
        },
      ],
      model: "gpt-4.1-mini",
    });

    const validated = KeywordExtractionSchema.safeParse(result);
    if (!validated.success || validated.error) {
      return next(
        new AppError(
          400,
          "Somthing went wrong in openai return response schema",
        ),
      );
    }

    const job = await Job.create({
      owner: userId,
      title,
      description,
      company: {
        name: company,
        domain: "google.com",
      },
      keywords: validated.data.keywords,
    });

    res.status(201).json({
      success: true,
      data: { job: job.toObject() as any },
    });
  },
);
