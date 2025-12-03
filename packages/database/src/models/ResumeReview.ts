import { ResumeReviewStatus } from "@visume/types";

import mongoose, { Schema, Types } from "mongoose";

const ResumeReviewSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner reference is required"],
      index: true,
    },
    resume: {
      type: Schema.Types.ObjectId,
      ref: "Resume",
      required: [true, "Resume reference is required"],
      index: true,
    },
    summary: {
      type: String,
      default: "",
      trim: true,
      maxlength: [5000, "Summary cannot exceed 5000 characters"],
    },
    status: {
      type: String,
      enum: Object.values(ResumeReviewStatus),
      default: ResumeReviewStatus.PENDING,
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
      required: [true, "Start time is required"],
    },
    finishedAt: {
      type: Date,
      required: [true, "Finish time is required"],
      validate: {
        validator: function (this, v: Date) {
          return v >= this.startedAt;
        },
        message: "Finished time must be after or equal to start time",
      },
    },
    suggestions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Suggestion",
      },
    ],
  },
  {
    timestamps: true,
    collection: "resume_reviews",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ============================================
// RESUME REVIEW INDEXES
// ============================================
ResumeReviewSchema.index({ owner: 1, createdAt: -1 });
ResumeReviewSchema.index({ resume: 1, createdAt: -1 });
ResumeReviewSchema.index({ status: 1, createdAt: -1 });
ResumeReviewSchema.index({ owner: 1, status: 1 });

ResumeReviewSchema.virtual("durationMs").get(function (this) {
  return this.finishedAt.getTime() - this.startedAt.getTime();
});

// Virtual for duration in seconds
ResumeReviewSchema.virtual("durationSeconds").get(function (this: any) {
  return Math.round(this.durationMs / 1000);
});

// =============================================
// RESUME REVIEW STATIC METHODS
// =============================================
ResumeReviewSchema.statics.findByResume = function (
  resumeId: Types.ObjectId,
): Promise<[]> {
  return this.find({ resume: resumeId })
    .sort({ createdAt: -1 })
    .populate("suggestions");
};

ResumeReviewSchema.statics.findByOwner = function (
  ownerId: Types.ObjectId,
): Promise<[]> {
  return this.find({ owner: ownerId })
    .sort({ createdAt: -1 })
    .populate("suggestions");
};

ResumeReviewSchema.statics.findCompletedReviews = function (
  resumeId: Types.ObjectId,
): Promise<[]> {
  return this.find({
    resume: resumeId,
    status: ResumeReviewStatus.COMPLETED,
  })
    .sort({ createdAt: -1 })
    .populate("suggestions");
};

ResumeReviewSchema.methods.markAsCompleted = async function () {
  this.status = ResumeReviewStatus.COMPLETED;
  this.finishedAt = new Date();
  return this.save();
};

ResumeReviewSchema.methods.markAsFailed = async function () {
  this.status = ResumeReviewStatus.FAILED;
  this.finishedAt = new Date();
  return this.save();
};

// ============================================
// RESUME REVIEW MIDDLEWARE
// ============================================
// Pre-save middleware to auto-set status based on conditions
ResumeReviewSchema.pre("save", async function (next) {
  // If finishedAt is set and status is PENDING, change to COMPLETED
  if (
    this.isModified("finishedAt") &&
    this.status === ResumeReviewStatus.PENDING &&
    this.suggestions.length > 0
  ) {
    this.status = ResumeReviewStatus.COMPLETED;
  }

  next();
});

export const ResumeReview = mongoose.model("ResumeReview", ResumeReviewSchema);
