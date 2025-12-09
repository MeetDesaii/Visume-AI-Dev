import mongoose, { InferSchemaType, Model, Schema, Types } from "mongoose";

const linkedinExperienceSchema = new Schema(
  {
    title: { type: String, trim: true, default: "", maxlength: 150 },
    companyName: { type: String, trim: true, default: "", maxlength: 200 },
    location: { type: String, trim: true, default: "", maxlength: 150 },
    startedAt: { type: Date },
    endedAt: { type: Date },
    description: { type: String, trim: true, default: "", maxlength: 6000 },
    achievements: {
      type: [String],
      default: [],
      set: (vals: string[]) =>
        (vals || []).map((v) => v.trim()).filter(Boolean),
    },
    skills: {
      type: [String],
      default: [],
      set: (vals: string[]) =>
        (vals || []).map((v) => v.trim()).filter(Boolean),
    },
  },
  { _id: true },
);

const linkedinEducationSchema = new Schema(
  {
    institutionName: { type: String, trim: true, default: "", maxlength: 200 },
    degreeTypeName: { type: String, trim: true, default: "", maxlength: 120 },
    fieldOfStudyName: { type: String, trim: true, default: "", maxlength: 120 },
    graduationAt: { type: Date },
    description: { type: String, trim: true, default: "", maxlength: 2000 },
  },
  { _id: true },
);

const linkedinCertificationSchema = new Schema(
  {
    title: { type: String, trim: true, default: "", maxlength: 150 },
    issuer: { type: String, trim: true, default: "", maxlength: 150 },
    startDate: { type: Date },
    expiryDate: { type: Date },
    credentialUrl: { type: String, trim: true, default: "", maxlength: 500 },
  },
  { _id: true },
);

const linkedinProfileSchema = new Schema(
  {
    owner: { type: Types.ObjectId, ref: "User", index: true },
    resume: { type: Types.ObjectId, ref: "Resume", index: true },

    firstName: { type: String, trim: true, default: "", maxlength: 80 },
    lastName: { type: String, trim: true, default: "", maxlength: 80 },
    headline: { type: String, trim: true, default: "", maxlength: 300 },
    about: { type: String, trim: true, default: "", maxlength: 10000 },
    location: { type: String, trim: true, default: "", maxlength: 150 },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      maxlength: 200,
    },
    phone: { type: String, trim: true, default: "", maxlength: 30 },
    websites: {
      type: [String],
      default: [],
      set: (vals: string[]) =>
        (vals || []).map((v) => v.trim()).filter(Boolean),
    },

    experiences: { type: [linkedinExperienceSchema], default: [] },
    educations: { type: [linkedinEducationSchema], default: [] },
    certifications: { type: [linkedinCertificationSchema], default: [] },
    skills: {
      type: [String],
      default: [],
      set: (vals: string[]) =>
        (vals || []).map((v) => v.trim()).filter(Boolean),
    },
    languages: {
      type: [String],
      default: [],
      set: (vals: string[]) =>
        (vals || []).map((v) => v.trim()).filter(Boolean),
    },
    accomplishments: {
      type: [String],
      default: [],
      set: (vals: string[]) =>
        (vals || []).map((v) => v.trim()).filter(Boolean),
    },

    rawText: { type: String, default: "" },
    sourceFileName: { type: String, trim: true, default: "", maxlength: 255 },
    sourceFileSize: { type: Number, min: 0, default: 0 },
    sourceFormat: { type: String, trim: true, default: "", maxlength: 20 },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

linkedinProfileSchema.index({ resume: 1, owner: 1 }, { unique: false });

export type LinkedInProfileDoc = InferSchemaType<typeof linkedinProfileSchema>;
export type LinkedInProfileModel = Model<LinkedInProfileDoc>;

export const LinkedInProfile: LinkedInProfileModel =
  mongoose.models.LinkedInProfile ||
  mongoose.model<LinkedInProfileDoc>("LinkedInProfile", linkedinProfileSchema);
