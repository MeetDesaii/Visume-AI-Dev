/**
 * File Parser Utility
 * Extracts text from PDF, DOCX, and other resume formats
 */

import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { logger } from "./logger";

/**
 * Extract text from PDF file
 *
 * @param buffer - PDF file buffer
 * @returns Extracted text
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = new PDFParse({ data: buffer });
    const extracted = await data.getText();
    return extracted.text;
  } catch (error) {
    logger.error(error, "PDF parsing error:");
    throw new Error("Failed to extract text from PDF");
  }
}

/**
 * Extract text from DOCX file
 *
 * @param buffer - DOCX file buffer
 * @returns Extracted text
 */
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    logger.error(error, "DOCX parsing error:");
    throw new Error("Failed to extract text from DOCX");
  }
}

/**
 * Extract text from plain text file
 *
 * @param buffer - Text file buffer
 * @returns Extracted text
 */
function extractTextFromTXT(buffer: Buffer): string {
  try {
    return buffer.toString("utf-8");
  } catch (error) {
    logger.error(error, "TXT parsing error:");
    throw new Error("Failed to extract text from TXT");
  }
}

/**
 * Extract text from resume file based on MIME type
 *
 * @param buffer - File buffer
 * @param mimetype - File MIME type
 * @returns Extracted text
 */
export async function extractTextFromResume(
  buffer: Buffer,
  mimetype: string,
): Promise<string> {
  logger.info(`Extracting text from file type: ${mimetype}`);

  let text: string;

  switch (mimetype) {
    case "application/pdf":
      text = await extractTextFromPDF(buffer);
      break;

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/msword":
      text = await extractTextFromDOCX(buffer);
      break;

    case "text/plain":
      text = extractTextFromTXT(buffer);
      break;

    default:
      throw new Error(`Unsupported file type: ${mimetype}`);
  }

  // Clean up the text
  text = cleanExtractedText(text);

  logger.info(`Text extracted successfully. Length: ${text.length} characters`);

  return text;
}

/**
 * Clean extracted text
 * Removes excessive whitespace, special characters, etc.
 *
 * @param text - Raw extracted text
 * @returns Cleaned text
 */
function cleanExtractedText(text: string): string {
  return (
    text
      // Remove excessive whitespace
      .replace(/\s+/g, " ")
      // Remove multiple newlines
      .replace(/\n{3,}/g, "\n\n")
      // Trim
      .trim()
  );
}

/**
 * Validate extracted text
 * Ensures text is meaningful and not empty
 *
 * @param text - Extracted text
 * @returns Validation result
 */
export function validateExtractedText(text: string): {
  isValid: boolean;
  error?: string;
  warnings?: string[];
} {
  const warnings: string[] = [];

  // Check if text is empty
  if (!text || text.trim().length === 0) {
    return {
      isValid: false,
      error: "No text could be extracted from the file",
    };
  }

  // Check minimum length (at least 100 characters for a valid resume)
  if (text.length < 100) {
    return {
      isValid: false,
      error:
        "Extracted text is too short. Please ensure the file contains a complete resume.",
    };
  }

  // Warning for very short resumes
  if (text.length < 500) {
    warnings.push(
      "Resume appears to be very short. Consider adding more details.",
    );
  }

  // Warning for very long resumes
  if (text.length > 10000) {
    warnings.push("Resume is quite long. Consider condensing to 1-2 pages.");
  }

  // Check for email (basic validation that it's a resume)
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  if (!emailRegex.test(text)) {
    warnings.push(
      "No email address found in resume. Ensure contact information is included.",
    );
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Get file statistics
 *
 * @param text - Extracted text
 * @returns File statistics
 */
export function getTextStatistics(text: string): {
  characterCount: number;
  wordCount: number;
  lineCount: number;
  estimatedPages: number;
} {
  const characterCount = text.length;
  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
  const lineCount = text.split("\n").length;

  // Estimate pages (approximately 500 words per page)
  const estimatedPages = Math.ceil(wordCount / 500);

  return {
    characterCount,
    wordCount,
    lineCount,
    estimatedPages,
  };
}
