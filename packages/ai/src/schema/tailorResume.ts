import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// ============================================
// ENUMS
// ============================================
export enum ResumeReviewStatus {
  COMPLETED = "COMPLETED",
  PENDING = "PENDING",
  FAILED = "FAILED",
}

export enum SuggestionsAcceptanceStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
}

export enum SuggestionsOperationAction {
  REPLACE = "REPLACE",
  ADD = "ADD",
  REMOVE = "REMOVE",
}

export enum SuggestionsPriority {
  RECOMMENDED = "RECOMMENDED",
  CRITICAL = "CRITICAL",
}

// ============================================
// ZOD SCHEMAS FOR LANGCHAIN (NO DEFAULTS)
// ============================================

const SuggestionsOperationSchema = z
  .object({
    action: z
      .nativeEnum(SuggestionsOperationAction)
      .describe(
        "The type of operation to perform: REPLACE (modify existing content), ADD (insert new content), or REMOVE (delete content)",
      ),
    actual: z
      .string()
      .describe(
        "The current/original text that exists in the resume. REQUIRED for REPLACE operations (shows what text will be changed). Empty string for ADD and REMOVE operations.",
      ),
    value: z
      .string()
      .describe(
        "The new content to use. For REPLACE: the replacement text. For ADD: the text to insert. For REMOVE: empty string.",
      ),
  })
  .strict()
  .describe("Defines the modification operation to apply to the resume");

const SuggestionSchema = z
  .object({
    title: z
      .string()
      .describe(
        "Short, action-oriented headline for the suggestion (5-10 words). Examples: 'Quantify team leadership impact with metrics', 'Add AWS keyword for ATS optimization'",
      ),

    description: z
      .string()
      .describe(
        "Detailed explanation (2-4 sentences) covering: (1) Why this change matters, (2) What specifically should change, (3) How it improves the resume. Be specific and actionable.",
      ),

    operation: SuggestionsOperationSchema,

    priority: z
      .nativeEnum(SuggestionsPriority)
      .describe(
        "Priority level: CRITICAL (severely impacts resume effectiveness, ATS blockers, major gaps) or RECOMMENDED (enhancements that improve but aren't essential)",
      ),

    path: z
      .string()
      .describe(
        "Technical dot-notation path to the field (e.g., 'workExperiences[0].achievements[2]', 'summery', 'skills[5]', 'educations[0].description'). Must exactly match the resume data structure.",
      ),

    documentPath: z
      .string()
      .describe(
        "Human-readable description using MongoDB ObjectId references. Format: 'Section Name._id:ObjectId.Field Name'. Examples: 'workExperiences._id:507f1f77bcf86cd799439011.achievements._id:507f191e810c19729de860ea.text', 'educations._id:68e34b1c9d303c0051dad197.description', 'skills._id:507f191e810c19729de860eb.name', 'summery' (for root fields)",
      ),

    sectionName: z
      .string()
      .describe(
        "Major section identifier: 'Work Experience', 'Professional Summary', 'Skills', 'Education', 'Projects', 'Certifications', or 'Volunteer Experience'",
      ),

    acceptanceStatus: z
      .nativeEnum(SuggestionsAcceptanceStatus)
      .describe(
        "Status of user acceptance. Always set to PENDING for new suggestions. Will be updated to COMPLETED after user accepts.",
      ),
  })
  .strict()
  .describe("A single actionable suggestion to improve the resume");

export const ResumeReviewSchema = z.object({
  summary: z
    .string()
    .describe(
      "Comprehensive review summary (3-5 paragraphs, 200-400 words) covering: (1) Overall assessment of resume strength, (2) Key strengths (2-3 points), (3) Primary opportunities for improvement (2-4 points), (4) ATS optimization notes, (5) Recommended focus areas. Be specific, encouraging, and actionable.",
    ),
  suggestions: z
    .array(SuggestionSchema)
    .describe(
      "Array of 8-15 actionable suggestions to improve the resume. Include 3-6 CRITICAL priority items and 5-9 RECOMMENDED items. Balance REPLACE, ADD, and REMOVE operations.",
    ),
});
