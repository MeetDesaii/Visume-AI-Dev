import mongoose, { Schema, InferSchemaType, Model, Types } from "mongoose";

/* ---------- Enums ---------- */
export enum JobKeywordPriority {
  MUST_HAVE = "MUST_HAVE",
  NICE_TO_HAVE = "NICE_TO_HAVE",
  OPTIONAL = "OPTIONAL",
}

export enum JobKeywordType {
  TECH_TOOL = "TECH_TOOL",
  SOFT_SKILL = "SOFT_SKILL",
  CERTIFICATION = "CERTIFICATION",
  DOMAIN = "DOMAIN",
}

/* ---------- Subdocuments ---------- */
const jobCompanySchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 200,
      index: true,
    },
    domain: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      maxlength: 200,
      index: true,
      validate: {
        validator: (v: string) =>
          /^[a-z0-9]+([\-\.][a-z0-9]+)*\.[a-z]{2,}$/.test(v),
        message: "Invalid domain format",
      },
    },
  },
  { _id: false },
);

const jobKeywordSchema = new Schema(
  {
    priority: {
      type: String,
      enum: Object.values(JobKeywordPriority),
      required: true,
      default: JobKeywordPriority.MUST_HAVE,
      index: true,
    },
    text: {
      type: String,
      trim: true,
      required: true,
      maxlength: 100,
      index: true,
    },
    jobMatches: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 50,
        message: "Cannot have more than 50 job matches",
      },
      set: (vals: string[]) =>
        (vals || []).map((v) => v.trim()).filter(Boolean),
    },
    type: {
      type: String,
      enum: Object.values(JobKeywordType),
      required: true,
      default: JobKeywordType.TECH_TOOL,
      index: true,
    },
  },
  { _id: false },
);

/* ---------- Main Schema ---------- */
const jobSchema = new Schema(
  {
    owner: { type: Types.ObjectId, ref: "User", index: true },
    title: {
      type: String,
      trim: true,
      required: true,
      maxlength: 200,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
      maxlength: 10000,
    },
    keywords: {
      type: [jobKeywordSchema],
      default: [],
      validate: {
        validator: (v: any[]) => v.length <= 100,
        message: "Cannot have more than 100 keywords",
      },
    },
    company: {
      type: jobCompanySchema,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ---------- Indexes ---------- */
// Text search index
jobSchema.index(
  {
    title: "text",
    description: "text",
    "keywords.text": "text",
    "company.name": "text",
  },
  {
    name: "job_text_search",
    weights: {
      title: 10,
      "keywords.text": 8,
      "company.name": 5,
      description: 3,
    },
  },
);

// Compound indexes for common queries
jobSchema.index({ "company.domain": 1, createdAt: -1 });
jobSchema.index({ "keywords.type": 1, "keywords.priority": 1 });
jobSchema.index({ createdAt: -1 });

/* ---------- Types / Model ---------- */
export type JobDoc = InferSchemaType<typeof jobSchema>;
export type JobModel = Model<JobDoc>;

export const Job: JobModel =
  mongoose.models.Job || mongoose.model<JobDoc>("Job", jobSchema);
