import mongoose, { InferSchemaType, Model, Schema, Types } from "mongoose";

const projectResultSchema = new Schema(
  {
    projectTitle: { type: String, trim: true, required: true, maxlength: 200 },
    repoName: { type: String, trim: true, default: "", maxlength: 200 },
    repoUrl: { type: String, trim: true, default: "", maxlength: 300 },
    status: {
      type: String,
      enum: ["MATCHED", "NOT_FOUND", "FAILED"],
      default: "NOT_FOUND",
    },
    matchConfidence: { type: Number, min: 0, max: 1, default: 0 },
    matchReasoning: { type: String, trim: true, default: "", maxlength: 4000 },
    repoSummary: { type: String, trim: true, default: "", maxlength: 12000 },
    supportedClaims: {
      type: [String],
      default: [],
      set: (vals: string[]) =>
        (vals || []).map((v) => v.trim()).filter(Boolean),
    },
    missingClaims: {
      type: [String],
      default: [],
      set: (vals: string[]) =>
        (vals || []).map((v) => v.trim()).filter(Boolean),
    },
    riskFlags: {
      type: [String],
      default: [],
      set: (vals: string[]) =>
        (vals || []).map((v) => v.trim()).filter(Boolean),
    },
    alignmentScore: { type: Number, min: 0, max: 100, default: 0 },
  },
  { _id: true },
);

const githubVerificationSchema = new Schema(
  {
    owner: { type: Types.ObjectId, ref: "User", index: true },
    resume: {
      type: Types.ObjectId,
      ref: "Resume",
      required: true,
      index: true,
    },
    githubProfileUrl: {
      type: String,
      trim: true,
      required: true,
      maxlength: 300,
    },
    profileMarkdown: { type: String, default: "" },

    projectResults: { type: [projectResultSchema], default: [] },

    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "COMPLETED",
      index: true,
    },
    overallScore: { type: Number, min: 0, max: 100, default: 0 },
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
  },
);

githubVerificationSchema.index(
  { resume: 1, githubProfileUrl: 1 },
  { unique: false },
);

export type GithubVerificationDoc = InferSchemaType<
  typeof githubVerificationSchema
>;
export type GithubVerificationModel = Model<GithubVerificationDoc>;

export const GithubVerification: GithubVerificationModel =
  mongoose.models.GithubVerification ||
  mongoose.model<GithubVerificationDoc>(
    "GithubVerification",
    githubVerificationSchema,
  );
