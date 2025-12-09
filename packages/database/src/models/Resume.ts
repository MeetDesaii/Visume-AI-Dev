import mongoose, { Schema, InferSchemaType, Types, Model } from "mongoose";

const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,})$/;
const PHONE_INTL = /^\+?[0-9 ()\-]{7,20}$/;

/* ---------- Common subdocs (ALL keep _id) ---------- */
const achievementSchema = new Schema({
  text: { type: String, trim: true, required: true, maxlength: 1000 },
});

const projectSchema = new Schema({
  title: { type: String, trim: true, required: true, maxlength: 200 },
  description: { type: String, trim: true, default: "", maxlength: 4000 },
  achievements: { type: [achievementSchema], default: [] },
  skills: {
    type: [String],
    default: [],
    set: (vals: string[]) => (vals || []).map((v) => v.trim()).filter(Boolean),
  },
});

const educationSchema = new Schema({
  institutionName: { type: String, trim: true, required: true, maxlength: 200 },
  degreeTypeName: { type: String, trim: true, default: "", maxlength: 100 },
  fieldOfStudyName: { type: String, trim: true, default: "", maxlength: 150 },
  graduationAt: { type: Date },
  description: { type: String, trim: true, default: "", maxlength: 2000 },
});

const experienceSchema = new Schema({
  isCurrentPosition: { type: Boolean, default: false },
  employerName: { type: String, trim: true, required: true, maxlength: 200 },
  jobTitle: { type: String, trim: true, required: true, maxlength: 150 },
  location: { type: String, trim: true, default: "", maxlength: 150 },
  startedAt: { type: Date },
  endedAt: { type: Date },
  role: { type: String, trim: true, default: "", maxlength: 4000 },
  achievements: { type: [achievementSchema], default: [] },
  skills: {
    type: [String],
    default: [],
    set: (vals: string[]) => (vals || []).map((v) => v.trim()).filter(Boolean),
  },
});

const certificationSchema = new Schema({
  title: { type: String, trim: true, required: true, maxlength: 150 },
  issuer: { type: String, trim: true, default: "", maxlength: 150 },
  startDate: { type: Date },
  expiryDate: { type: Date },
  link: { type: String, trim: true, default: "", maxlength: 500 },
});

const skillSchema = new Schema({
  name: { type: String, trim: true, required: true, maxlength: 60 },
});

const skillCategorySchema = new Schema({
  categoryName: { type: String, trim: true, required: true, maxlength: 80 },
  skills: { type: [skillSchema], default: [] },
});

const resumeSectionSchema = new Schema({
  sectionId: { type: String, trim: true, required: true, maxlength: 60 },
  title: { type: String, trim: true, required: true, maxlength: 120 },
});

/* ---------- Score / meta (keep _id on nested docs) ---------- */
const sectionCompletionSchema = new Schema({
  missingFields: {
    type: [String],
    default: [],
    set: (vals: string[]) => (vals || []).map((v) => v.trim()).filter(Boolean),
  },
  score: { type: Number, min: 0, max: 1, default: 0 },
  finishedScoring: { type: Boolean, default: false },
});

const contentLengthSchema = new Schema({
  score: { type: Number, min: 0, max: 1, default: 0 },
  pros: { type: String, trim: true, default: "", maxlength: 2000 },
  cons: { type: String, trim: true, default: "", maxlength: 2000 },
  finishedScoring: { type: Boolean, default: false },
});

const resumeScoreSchema = new Schema({
  sectionCompletion: { type: sectionCompletionSchema, default: {} },
  contentLength: { type: contentLengthSchema, default: {} },
  score: { type: Number, min: 0, max: 1, default: 0 },
});

const profilesSchema = new Schema({
  linkedin: {
    type: String,
    trim: true,
    lowercase: true,
    default: "",
    maxlength: 100,
  },
  github: {
    type: String,
    trim: true,
    lowercase: true,
    default: "",
    maxlength: 100,
  },
});

const metadataSchema = new Schema({
  pages: { type: Number, min: 0, default: 0 },
  fileSize: { type: Number, min: 0, default: 0 },
});

const sourceInfoSchema = new Schema({
  resumeName: { type: String, trim: true, default: "", maxlength: 200 },
  rawText: { type: String, default: "" },
});

/* ---------- Root schema ---------- */
const resumeSchema = new Schema(
  {
    owner: { type: Types.ObjectId, ref: "User", index: true },
    job: { type: Types.ObjectId, ref: "Job", index: true },

    profiles: { type: profilesSchema, default: {} },
    resumeScore: { type: resumeScoreSchema, default: {} },
    metadata: { type: metadataSchema, default: {} },

    resumeName: {
      type: String,
      trim: true,
      required: true,
      maxlength: 200,
    },
    targetJobTitle: {
      type: String,
      trim: true,
      default: "",
      maxlength: 150,
      index: true,
    },

    firstName: {
      type: String,
      trim: true,
      required: true,
      maxlength: 80,
      index: true,
    },
    lastName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 80,
      index: true,
    },
    location: { type: String, trim: true, default: "", maxlength: 150 },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: { validator: (v: string) => !v || EMAIL_REGEX.test(v) },
      index: true,
      maxlength: 200,
    },
    phoneNumber: {
      type: String,
      trim: true,
      validate: { validator: (v: string) => !v || PHONE_INTL.test(v) },
      maxlength: 30,
    },

    summary: { type: String, trim: true, default: "", maxlength: 8000 },

    links: {
      type: [String],
      default: [],
      set: (vals: string[]) =>
        (vals || []).map((v) => v.trim()).filter(Boolean),
    },

    projects: { type: [projectSchema], default: [] },
    educations: { type: [educationSchema], default: [] },
    workExperiences: { type: [experienceSchema], default: [] },

    volunteerExperiences: { type: [experienceSchema], default: [] },

    certifications: { type: [certificationSchema], default: [] },
    skills: { type: [skillSchema], default: [] },
    skillsCategories: { type: [skillCategorySchema], default: [] },

    resumeSections: { type: [resumeSectionSchema], default: [] },
    sourceInfo: { type: sourceInfoSchema, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ---------- Virtuals ---------- */
resumeSchema.virtual("fullName").get(function (this: any) {
  return [this.firstName, this.lastName].filter(Boolean).join(" ").trim();
});

resumeSchema.virtual("totalExperienceMonths").get(function (this: any) {
  if (!Array.isArray(this.workExperiences)) return 0;
  const months = this.workExperiences
    .map((exp: any) => {
      const start = exp.startedAt ? new Date(exp.startedAt) : null;
      const end = exp.endedAt
        ? new Date(exp.endedAt)
        : exp.isCurrentPosition
          ? new Date()
          : null;
      if (!start || !end) return 0;
      const diff =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      return Math.max(0, Math.round(diff));
    })
    .reduce((a: number, b: number) => a + b, 0);
  return months;
});

/* ---------- Indexes ---------- */
resumeSchema.index(
  {
    summary: "text",
    "projects.title": "text",
    "projects.description": "text",
    "projects.achievements.text": "text",
    "workExperiences.employerName": "text",
    "workExperiences.jobTitle": "text",
    "workExperiences.achievements.text": "text",
    "volunteerExperiences.employerName": "text",
    "volunteerExperiences.jobTitle": "text",
    "volunteerExperiences.achievementsWithVectors.text": "text",
    "educations.institutionName": "text",
    "skillCategories.categoryName": "text",
    "skills.name": "text",
    firstName: "text",
    lastName: "text",
    targetJobTitle: "text",
  },
  {
    name: "resume_text_search",
    weights: {
      summary: 8,
      "workExperiences.jobTitle": 7,
      "projects.title": 6,
      "projects.description": 4,
      "workExperiences.achievements.text": 4,
      "skills.name": 3,
      "educations.institutionName": 2,
      firstName: 1,
      lastName: 1,
    },
  },
);

resumeSchema.index({ ownerId: 1 }, { unique: true, sparse: true });
resumeSchema.index({ email: 1 });

export type ResumeDoc = InferSchemaType<typeof resumeSchema>;
export type ResumeModel = Model<ResumeDoc>;

export const Resume: ResumeModel =
  mongoose.models.Resume || mongoose.model<ResumeDoc>("Resume", resumeSchema);
