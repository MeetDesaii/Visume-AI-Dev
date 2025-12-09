import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

/** -------- Leaf schemas with descriptions -------- */
const ProfilesSchema = z
  .object({
    linkedin: z
      .string()
      .trim()
      .describe(
        "LinkedIn profile URL or username. Empty string if not provided.",
      ),
    github: z
      .string()
      .trim()
      .describe(
        "GitHub profile URL or username. Empty string if not provided.",
      ),
  })
  .strict()
  .describe("Social and professional profile links");

const SectionCompletionSchema = z
  .object({
    missingFields: z
      .array(z.string().trim())
      .describe(
        "List of field names that are empty or missing from the resume (e.g., ['email', 'phoneNumber', 'summery'])",
      ),
    score: z
      .number()
      .min(0)
      .max(1)
      .describe(
        "Completeness score from 0.0 to 1.0. 1.0 = all sections present, 0.5 = several missing, 0.0 = severely incomplete",
      ),
    finishedScoring: z
      .boolean()
      .describe("Must be set to true when scoring is complete"),
  })
  .strict()
  .describe("Evaluation of which resume sections are present and complete");

const ContentLengthSchema = z
  .object({
    score: z
      .number()
      .min(0)
      .max(1)
      .describe(
        "Content depth score from 0.0 to 1.0. 1.0 = rich quantified details, 0.5 = basic info, 0.0 = very sparse",
      ),
    pros: z
      .string()
      .describe(
        "Strengths in the resume content (e.g., 'Strong quantified achievements in work experience'). Empty string if none.",
      ),
    cons: z
      .string()
      .describe(
        "Weaknesses in the resume content (e.g., 'Project descriptions lack technical detail'). Empty string if none.",
      ),
    finishedScoring: z
      .boolean()
      .describe("Must be set to true when scoring is complete"),
  })
  .strict()
  .describe("Evaluation of content depth and quality");

const ResumeScoreSchema = z
  .object({
    sectionCompletion: SectionCompletionSchema,
    contentLength: ContentLengthSchema,
    score: z
      .number()
      .min(0)
      .max(1)
      .describe(
        "Overall resume score, calculated as average of sectionCompletion.score and contentLength.score",
      ),
  })
  .strict()
  .describe("Complete scoring breakdown of the resume");

const AchievementSchema = z
  .object({
    text: z
      .string()
      .trim()
      .describe(
        "A single achievement or accomplishment bullet point, preferably with quantified results",
      ),
  })
  .strict()
  .describe("An achievement or accomplishment statement");

const ProjectSchema = z
  .object({
    title: z.string().trim().describe("Name of the project (REQUIRED)"),
    description: z
      .string()
      .describe(
        "Brief overview of what the project does or accomplished. Empty string if not provided.",
      ),
    achievements: z
      .array(AchievementSchema)
      .describe(
        "Key accomplishments, features, or results from this project. Empty array if none listed.",
      ),
    skills: z
      .array(z.string().trim())
      .describe(
        "Technologies, programming languages, tools, or frameworks used. Empty array if none listed.",
      ),
  })
  .strict()
  .describe("A personal or academic project");

const EducationSchema = z
  .object({
    institutionName: z
      .string()
      .trim()
      .describe(
        "Name of the school, university, or educational institution (REQUIRED)",
      ),
    degreeTypeName: z
      .string()
      .trim()
      .describe(
        "Type of degree (e.g., 'Bachelor of Science', 'Master of Arts', 'PhD', 'Associate'). Empty string if not specified.",
      ),
    fieldOfStudyName: z
      .string()
      .trim()
      .describe(
        "Major or field of study (e.g., 'Computer Science', 'Business Administration'). Empty string if not specified.",
      ),
    graduationAt: z
      .string()
      .nullable()
      .describe(
        "Graduation date in 'YYYY-MM' or 'YYYY' format. Null if not provided or still enrolled.",
      ),
    description: z
      .string()
      .describe(
        "Additional details such as GPA, honors, relevant coursework, or activities. Empty string if not provided.",
      ),
  })
  .strict()
  .describe("Educational background entry");

const ExperienceSchema = z
  .object({
    isCurrentPosition: z
      .boolean()
      .describe("True if this is the candidate's current job, false otherwise"),
    employerName: z
      .string()
      .trim()
      .describe("Name of the company or organization (REQUIRED)"),
    jobTitle: z.string().trim().describe("Position or role title (REQUIRED)"),
    location: z
      .string()
      .describe(
        "Job location (e.g., 'San Francisco, CA', 'Remote'). Empty string if not specified.",
      ),
    startedAt: z
      .string()
      .nullable()
      .describe(
        "Start date in 'YYYY-MM' or 'YYYY' format. Null if not provided.",
      ),
    endedAt: z
      .string()
      .nullable()
      .describe(
        "End date in 'YYYY-MM' or 'YYYY' format. Null if not provided or if current position.",
      ),
    role: z
      .string()
      .describe(
        "Brief description of the role and responsibilities. Empty string if not provided.",
      ),
    achievements: z
      .array(AchievementSchema)
      .describe(
        "Accomplishments and impact in this role, ideally with quantified results. Empty array if none listed.",
      ),
    skills: z
      .array(z.string().trim())
      .describe(
        "Skills, technologies, or tools used in this position. Empty array if none listed.",
      ),
  })
  .strict()
  .describe("Work or volunteer experience entry");

const CertificationSchema = z
  .object({
    title: z
      .string()
      .trim()
      .describe("Name of the certification. Empty string if not provided."),
    issuer: z
      .string()
      .trim()
      .describe(
        "Organization that issued the certification. Empty string if not provided.",
      ),
    startDate: z
      .string()
      .nullable()
      .describe(
        "Date the certification was issued in 'YYYY-MM' or 'YYYY' format. Null if not provided.",
      ),
    expiryDate: z
      .string()
      .nullable()
      .describe(
        "Date the certification expires in 'YYYY-MM' or 'YYYY' format. Null if no expiry or not provided.",
      ),
    link: z
      .string()
      .trim()
      .describe(
        "URL to verify the certification. Empty string if not provided.",
      ),
  })
  .strict()
  .describe("Professional certification or license");

const SkillSchema = z
  .object({
    name: z
      .string()
      .trim()
      .describe("Name of a skill, technology, tool, or competency"),
  })
  .strict()
  .describe("A single skill");

const SkillsCategorySchema = z
  .object({
    categoryName: z
      .string()
      .trim()
      .describe(
        "Category label (e.g., 'Programming Languages', 'Frameworks', 'Tools', 'Soft Skills')",
      ),
    skills: z
      .array(SkillSchema)
      .describe("List of skills that belong to this category"),
  })
  .strict()
  .describe("A categorized group of skills");

const ResumeSectionsSchema = z.object({
  title: z.string().describe("Name of the section that user will see"),
  sectionId: z.string().describe("Name of the section that is in lowercase"),
});

/** -------- Root schema -------- */
export const ResumeExtractionSchema = z
  .object({
    profiles: ProfilesSchema,
    resumeScore: ResumeScoreSchema,

    resumeName: z
      .string()
      .trim()
      .describe(
        "The name of the resume. Which post is resume about. e.g. Full Stack Web Developer, Mobile Developer, Android Developer etc. (REQUIRED)",
      ),
    firstName: z.string().trim().describe("First/given name only (REQUIRED)"),
    lastName: z.string().trim().describe("Last/family name only (REQUIRED)"),

    location: z
      .string()
      .describe(
        "Current location of the candidate (e.g., 'San Francisco, CA'). Empty string if not provided.",
      ),
    email: z
      .string()
      .trim()
      .describe("Email address. Empty string if not provided."),
    phoneNumber: z
      .string()
      .trim()
      .describe("Phone number in any format. Empty string if not provided."),
    summary: z
      .string()
      .describe(
        "Professional summary or objective statement. NOTE: Field name is 'summery' not 'summary'. Empty string if not provided.",
      ),

    links: z
      .array(z.string().trim())
      .describe(
        "Other URLs mentioned in the resume (portfolio, personal website, blog, etc.). Empty array if none.",
      ),

    projects: z
      .array(ProjectSchema)
      .describe(
        "Personal, academic, or side projects. Empty array if none listed.",
      ),
    educations: z
      .array(EducationSchema)
      .describe("Educational background. Empty array if none listed."),
    workExperiences: z
      .array(ExperienceSchema)
      .describe("Paid work experience. Empty array if none listed."),
    volunteerExperiences: z
      .array(ExperienceSchema)
      .describe("Volunteer or unpaid experience. Empty array if none listed."),
    certifications: z
      .array(CertificationSchema)
      .describe(
        "Professional certifications, licenses, or credentials. Empty array if none listed.",
      ),
    skills: z
      .array(SkillSchema)
      .describe(
        "Flat list of all skills mentioned in the resume. Empty array if none listed.",
      ),
    skillsCategories: z
      .array(SkillsCategorySchema)
      .describe(
        "Skills organized by category if the resume groups them. Empty array if not categorized or no skills.",
      ),

    resumeSections: z
      .array(ResumeSectionsSchema)
      .describe(
        "List of all the sections that are present in the provided resume and the ones you have extracted content from.",
      ),
  })
  .strict()
  .describe(
    "Complete structured extraction of a resume including personal info, experience, education, skills, and quality scoring",
  );

export type ResumeExtraction = z.infer<typeof ResumeExtractionSchema>;

// Convert Zod schema to JSON Schema
export const ResumeExtractionJsonSchema = zodToJsonSchema(
  ResumeExtractionSchema,
  {
    name: "ResumeExtraction",
    $refStrategy: "none", // Important: inline all definitions to avoid $ref issues
  },
);
