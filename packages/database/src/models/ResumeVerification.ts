import mongoose, { InferSchemaType, Model, Schema, Types } from "mongoose";

const verificationSectionSchema = new Schema(
  {
    section: { type: String, trim: true, required: true, maxlength: 120 },
    score: { type: Number, min: 0, max: 100, required: true },
    weight: { type: Number, min: 0, max: 1, required: true },
    rationale: { type: String, trim: true, default: "", maxlength: 2000 },
    coverage: { type: Number, min: 0, max: 1, default: 0 },
  },
  { _id: true }
);

const resumeVerificationSchema = new Schema(
  {
    owner: { type: Types.ObjectId, ref: "User", index: true },
    resume: {
      type: Types.ObjectId,
      ref: "Resume",
      required: true,
      index: true,
    },
    linkedinProfile: { type: Types.ObjectId, ref: "LinkedInProfile" },

    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "COMPLETED",
      index: true,
    },
    findings: {
      type: [String],
      default: [],
      set: (vals: string[]) =>
        (vals || []).map((v) => v.trim()).filter(Boolean),
    },
    resumeAssertions: {
      type: [String],
      default: [],
      set: (vals: string[]) =>
        (vals || []).map((v) => v.trim()).filter(Boolean),
    },
    sectionScores: { type: [verificationSectionSchema], default: [] },
    overallScore: { type: Number, min: 0, max: 100, default: 0 },
    scoringMethod: { type: String, trim: true, default: "", maxlength: 120 },
    runMetadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

resumeVerificationSchema.index(
  { resume: 1, linkedinProfile: 1 },
  { unique: false }
);

export type ResumeVerificationDoc = InferSchemaType<
  typeof resumeVerificationSchema
>;
export type ResumeVerificationModel = Model<ResumeVerificationDoc>;

export const ResumeVerification: ResumeVerificationModel =
  mongoose.models.ResumeVerification ||
  mongoose.model<ResumeVerificationDoc>(
    "ResumeVerification",
    resumeVerificationSchema
  );
