import type { Buffer } from "node:buffer";

export enum FileFormat {
  PDF = "pdf",
  DOCX = "docx",
  DOC = "doc",
  TXT = "txt",
}

export interface ExtractionResult {
  success: boolean;
  text: string;
  format: FileFormat;
  error?: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
  };
}

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}
