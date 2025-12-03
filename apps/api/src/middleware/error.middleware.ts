import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = new AppError(404, message);
  }

  // Mongoose duplicate key
  if ((err as any).code === 11000) {
    const message = "Duplicate field value entered";
    error = new AppError(400, message);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values((err as any).errors)
      .map((val: any) => val.message)
      .join(", ");
    error = new AppError(400, message);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = new AppError(401, message);
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    error = new AppError(401, message);
  }

  // Send response
  res.status((error as AppError).statusCode || 500).json({
    success: false,
    error: {
      message: error.message || "Server Error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
};

// Async error handler wrapper
export const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
