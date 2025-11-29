/**
 * File Upload Middleware
 * Handles file uploads using multer with validation
 */

import multer from "multer";
import { Request } from "express";
import { logger } from "../utils/logger";

// File type validation
const ALLOWED_MIME_TYPES = [
  "application/pdf", // PDF
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
  "application/msword", // DOC
  "text/plain", // TXT
];

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt"];

// File size limit (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

/**
 * Multer storage configuration
 * Uses memory storage since we'll upload to S3
 */
const storage = multer.memoryStorage();

/**
 * File filter function
 * Validates file type and extension
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    logger.warn(`Rejected file upload - invalid MIME type: ${file.mimetype}`);
    return callback(
      new Error(`Invalid file type. Allowed types: PDF, DOCX, DOC, TXT`)
    );
  }

  // Check file extension
  const extension = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    logger.warn(`Rejected file upload - invalid extension: ${extension}`);
    return callback(
      new Error(
        `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(", ")}`
      )
    );
  }

  // File is valid
  callback(null, true);
};

/**
 * Multer upload middleware
 * Configured for resume uploads
 */
const createSingleFileUpload = (fieldName: string) =>
  multer({
    storage,
    fileFilter,
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: 1,
    },
  }).single(fieldName);

export const uploadResume: any = createSingleFileUpload("resume");
export const uploadLinkedInProfile: any = createSingleFileUpload("linkedinProfile");

/**
 * Upload error handler middleware
 * Provides user-friendly error messages for upload errors
 */
export function handleUploadError(
  err: any,
  _req: Request,
  res: any,
  next: any
) {
  console.log("HELLLOOOO");
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large",
        message: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        error: "Too many files",
        message: "Only one file can be uploaded at a time",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: "Unexpected field",
        message: 'File field must be named "resume"',
      });
    }

    // Other multer errors
    return res.status(400).json({
      error: "Upload error",
      message: err.message,
    });
  }

  if (err) {
    // Custom validation errors (from fileFilter)
    logger.error(err, "Upload error:");
    return res.status(400).json({
      error: "Invalid file",
      message: err.message,
    });
  }

  next();
}

/**
 * Validate uploaded file exists
 * Middleware to check if file was uploaded
 */
export function validateFileUploaded(req: Request, res: any, next: any) {
  if (!req.file) {
    return res.status(400).json({
      error: "No file uploaded",
      message: "Please upload a document (PDF, DOCX, DOC, or TXT)",
    });
  }
  next();
}

/**
 * File metadata interface
 */
export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

/**
 * Get file info from request
 */
export function getUploadedFile(req: Request): UploadedFile | null {
  if (!req.file) return null;

  return {
    buffer: req.file.buffer,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  };
}
