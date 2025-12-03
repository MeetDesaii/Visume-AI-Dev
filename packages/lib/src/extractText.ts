import fs from "fs/promises";
import path from "path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { ExtractionResult, FileFormat } from "@visume/types";

/**
 * Extract text from PDF files
 */
async function extractFromPDF(buffer: Buffer): Promise<string> {
  const uint8Array = new Uint8Array(buffer);

  const parser = new PDFParse(uint8Array);
  const data = await parser.getText();

  return data.text;
}

/**
 * Extract text from DOCX files
 */
async function extractFromDOCX(buffer: Buffer): Promise<string> {
  //  const uint8Array = new Uint8Array(buffer);

  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Extract text from DOC files (legacy format)
 * Note: DOC format requires additional system dependencies or cloud services
 * This is a placeholder - consider using LibreOffice/pandoc or cloud APIs
 */
async function extractFromDOC(buffer: Buffer): Promise<string> {
  throw new Error(
    "Legacy DOC format requires additional tools. " +
      "Please convert to DOCX or use system tools like LibreOffice/Antiword.",
  );
}

/**
 * Extract text from plain text files
 */
async function extractFromTXT(buffer: Buffer): Promise<string> {
  return buffer.toString("utf-8");
}

/**
 * Detect file format from extension or buffer
 */
function detectFormat(filePath: string): FileFormat {
  const ext = path.extname(filePath).toLowerCase().slice(1);

  switch (ext) {
    case "pdf":
      return FileFormat.PDF;
    case "docx":
      return FileFormat.DOCX;
    case "doc":
      return FileFormat.DOC;
    case "txt":
      return FileFormat.TXT;
    default:
      throw new Error(`Unsupported file format: ${ext}`);
  }
}

/**
 * Main function to extract text from various file formats
 * @param filePath - Path to the file or buffer
 * @param fileBuffer - Optional buffer if file is already in memory
 * @returns ExtractionResult with text and metadata
 */
export async function extractTextFromBuffer(
  filePath: string,
  fileBuffer?: Buffer,
): Promise<ExtractionResult> {
  try {
    // Read file if buffer not provided
    const buffer = fileBuffer || (await fs.readFile(filePath));
    const format = detectFormat(filePath);

    let text: string;

    // Extract text based on format
    switch (format) {
      case FileFormat.PDF:
        text = await extractFromPDF(buffer);
        break;
      case FileFormat.DOCX:
        text = await extractFromDOCX(buffer);
        break;
      case FileFormat.DOC:
        text = await extractFromDOC(buffer);
        break;
      case FileFormat.TXT:
        text = await extractFromTXT(buffer);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Clean up text (remove excessive whitespace)
    const cleanedText = text.trim().replace(/\n{3,}/g, "\n\n");

    // Calculate metadata
    const wordCount = cleanedText
      .split(/\s+/)
      .filter((word) => word.length > 0).length;

    return {
      success: true,
      text: cleanedText,
      format,
      metadata: {
        wordCount,
      },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return {
      success: false,
      text: "",
      format: FileFormat.TXT,
      error: errorMessage,
    };
  }
}
