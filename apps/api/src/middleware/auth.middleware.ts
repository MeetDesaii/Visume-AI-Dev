import { Request, Response, NextFunction, RequestHandler } from "express";
import { clerkAuth, clerkOptionalAuth } from "../config/clerk";
import { logger } from "../utils/logger";
import { AppError } from "./error.middleware";
import { User } from "@visume/database";

// Require authentication
export const requireAuth: RequestHandler = clerkAuth;

// Optional authentication
export const optionalAuth: RequestHandler = clerkOptionalAuth;

// Attach user to request
export const attachUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.auth.userId) {
      const user: any = await User.findOne({ clerkId: req.auth.userId });
      if (user) {
        req.user = user;
      } else {
        next(new AppError(401, "Error attaching user, User not found"));
      }
    }
    next();
  } catch (error) {
    logger.error(error, "Error attaching user:");
    next(error);
  }
};
