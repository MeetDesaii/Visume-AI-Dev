import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { z } from "zod";

// Express validator middleware
export const validateRequest = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    next();
  };
};

// Zod validation middleware
export const validateSchema = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Common validation schemas
export const schemas = {
  createResume: z.object({
    title: z.string().min(1).max(100),
    content: z.object({
      personalInfo: z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        location: z.string().optional(),
      }),
      summary: z.string().optional(),
      experience: z.array(
        z.object({
          company: z.string(),
          position: z.string(),
          startDate: z.string().datetime(),
          endDate: z.string().datetime().optional(),
          description: z.string(),
          achievements: z.array(z.string()).optional(),
        }),
      ),
      education: z.array(
        z.object({
          institution: z.string(),
          degree: z.string(),
          field: z.string(),
          startDate: z.string().datetime(),
          endDate: z.string().datetime().optional(),
        }),
      ),
      skills: z.array(z.string()),
    }),
  }),

  analyzeResume: z.object({
    resumeId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    jobDescription: z.string().min(50),
  }),

  tailorResume: z.object({
    resumeId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    jobDescription: z.string().min(50),
    generateSummary: z.boolean().optional(),
    optimizeKeywords: z.boolean().optional(),
  }),
};
