import { z } from "zod";

const LinkedInExperienceSchema = z
  .object({
    title: z
      .string()
      .trim()
      .describe(
        "Role or job title exactly as listed on LinkedIn. Empty string if missing.",
      ),
    companyName: z
      .string()
      .trim()
      .describe(
        "Company/organization name for the role. Empty string if missing.",
      ),
    location: z
      .string()
      .trim()
      .describe(
        "Location string shown on LinkedIn for the role. Empty string if not listed.",
      ),
    startedAt: z
      .string()
      .trim()
      .nullable()
      .describe(
        "Start date in 'YYYY-MM' or 'YYYY' format. Null if not provided.",
      ),
    endedAt: z
      .string()
      .trim()
      .nullable()
      .describe(
        "End date in 'YYYY-MM' or 'YYYY' format. Null if current or not provided.",
      ),
    description: z
      .string()
      .describe(
        "Paragraph/lines describing responsibilities. Empty string if missing.",
      ),
    achievements: z
      .array(z.string().trim())
      .describe(
        "Bullet achievements/impact statements for this role. Empty array if none.",
      ),
    skills: z
      .array(z.string().trim())
      .describe(
        "Skills/tools explicitly listed under this experience. Empty array if none.",
      ),
  })
  .strict()
  .describe("LinkedIn experience entry");

const LinkedInEducationSchema = z
  .object({
    institutionName: z
      .string()
      .trim()
      .describe(
        "Educational institution name. Empty string if missing in the PDF.",
      ),
    degreeTypeName: z
      .string()
      .trim()
      .describe("Degree type or program. Empty string if missing."),
    fieldOfStudyName: z
      .string()
      .trim()
      .describe("Major/field of study. Empty string if missing."),
    graduationAt: z
      .string()
      .trim()
      .nullable()
      .describe(
        "Graduation/completion date in 'YYYY-MM' or 'YYYY'. Null if N/A.",
      ),
    description: z
      .string()
      .describe(
        "Supporting details such as GPA, honors, coursework. Empty string if missing.",
      ),
  })
  .strict()
  .describe("LinkedIn education entry");

const LinkedInCertificationSchema = z
  .object({
    title: z
      .string()
      .trim()
      .describe("Certification or license title. Empty string if missing."),
    issuer: z
      .string()
      .trim()
      .describe("Issuing organization. Empty string if missing."),
    startDate: z
      .string()
      .trim()
      .nullable()
      .describe("Issue date in 'YYYY-MM' or 'YYYY'. Null if missing."),
    expiryDate: z
      .string()
      .trim()
      .nullable()
      .describe(
        "Expiry date in 'YYYY-MM' or 'YYYY'. Null if no expiry or missing.",
      ),
    credentialUrl: z
      .string()
      .trim()
      .describe("Verification URL. Empty string if missing."),
  })
  .strict()
  .describe("LinkedIn certification entry");

export const LinkedInProfileSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .describe("LinkedIn first name value. Empty string if not found."),
    lastName: z
      .string()
      .trim()
      .describe("LinkedIn last name value. Empty string if not found."),
    headline: z
      .string()
      .describe(
        "Headline/headline banner text under the name. Empty string if missing.",
      ),
    about: z
      .string()
      .describe(
        "About/Summary section text. Empty string if missing from the PDF.",
      ),
    location: z
      .string()
      .trim()
      .describe(
        "Location string from profile header. Empty string if not captured.",
      ),
    email: z
      .string()
      .trim()
      .describe(
        "Email address if visible in the PDF export. Empty string if missing.",
      ),
    phone: z
      .string()
      .trim()
      .describe(
        "Phone number if visible in the PDF export. Empty string if missing.",
      ),
    websites: z
      .array(z.string().trim())
      .describe(
        "Personal websites or portfolio links shown in the contact block. Empty array if none.",
      ),
    experiences: z
      .array(LinkedInExperienceSchema)
      .describe("All LinkedIn experiences in reverse chronological order."),
    educations: z
      .array(LinkedInEducationSchema)
      .describe("All education entries present on the LinkedIn PDF."),
    certifications: z
      .array(LinkedInCertificationSchema)
      .describe("Certifications or licenses listed in the PDF."),
    skills: z
      .array(z.string().trim())
      .describe(
        "Flat list of skills from the LinkedIn skills section. Empty array if none.",
      ),
    languages: z
      .array(z.string().trim())
      .describe(
        "Languages listed in the PDF. Empty array if none are present.",
      ),
    accomplishments: z
      .array(z.string().trim())
      .describe(
        "Honors, awards, publications, or accomplishments shown. Empty array if none.",
      ),
  })
  .strict()
  .describe(
    "Structured LinkedIn profile extracted from a PDF export. Use empty strings/arrays when fields are missing.",
  );

export type LinkedInProfile = z.infer<typeof LinkedInProfileSchema>;
