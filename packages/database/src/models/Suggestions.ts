import {
  SuggestionsAcceptanceStatus,
  SuggestionsOperationAction,
  SuggestionsPriority,
} from "@visume/types";
import mongoose, { Schema, Types } from "mongoose";

const SuggestionsOperationSchema = new Schema(
  {
    action: {
      type: String,
      enum: Object.values(SuggestionsOperationAction),
      required: [true, "Operation action is required"],
    },
    actual: {
      type: String,
      default: "",
      maxlength: [5000, "Actual text cannot exceed 5000 characters"],
    },
    value: {
      type: String,
      default: "",
      maxlength: [5000, "Operation value cannot exceed 5000 characters"],
    },
  },
  { _id: false },
);

const SuggestionSchema = new Schema(
  {
    resumeReview: {
      type: Schema.Types.ObjectId,
      ref: "ResumeReview",
      required: [true, "Resume review reference is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Suggestion title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Suggestion description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    operation: {
      type: SuggestionsOperationSchema,
      required: [true, "Operation is required"],
    },
    priority: {
      type: String,
      enum: Object.values(SuggestionsPriority),
      required: [true, "Priority is required"],
      index: true,
    },
    path: {
      type: String,
      required: [true, "Path is required"],
      trim: true,
    },
    documentPath: {
      type: String,
      required: [true, "Document path is required"],

      trim: true,
    },
    sectionName: {
      type: String,
      required: [true, "Section name is required"],
      trim: true,
      enum: [
        "Work Experience",
        "Professional Summary",
        "Skills",
        "Education",
        "Projects",
        "Certifications",
        "Volunteer Experience",
      ],
      index: true,
    },
    acceptanceStatus: {
      type: String,
      enum: Object.values(SuggestionsAcceptanceStatus),
      default: SuggestionsAcceptanceStatus.PENDING,
      required: true,
      index: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "suggestions",
  },
);

// ============================================
// SUGGESTION INDEXES
// ============================================
SuggestionSchema.index({ resumeReview: 1, priority: 1 });
SuggestionSchema.index({ resumeReview: 1, acceptanceStatus: 1 });
SuggestionSchema.index({ resumeReview: 1, sectionName: 1 });

// ============================================
// SUGGESTION STATIC METHODS
// ============================================
SuggestionSchema.statics.findByResumeReview = function (
  reviewId: Types.ObjectId,
) {
  return this.find({ resumeReview: reviewId }).sort({
    priority: -1,
    createdAt: 1,
  });
};

SuggestionSchema.statics.findPendingSuggestions = function (
  reviewId: Types.ObjectId,
) {
  return this.find({
    resumeReview: reviewId,
    acceptanceStatus: SuggestionsAcceptanceStatus.PENDING,
  }).sort({ priority: -1, createdAt: 1 });
};

SuggestionSchema.statics.findCriticalSuggestions = function (
  reviewId: Types.ObjectId,
) {
  return this.find({
    resumeReview: reviewId,
    priority: SuggestionsPriority.CRITICAL,
  });
};

// ============================================
// SUGGESTION INSTANCE METHODS
// ============================================
SuggestionSchema.methods.accept = async function () {
  this.acceptanceStatus = SuggestionsAcceptanceStatus.COMPLETED;
  this.acceptedAt = new Date();
  return this.save();
};

// ============================================
// SUGGESTION MIDDLEWARE
// ============================================
// Pre-save middleware to validate operation value based on action
SuggestionSchema.pre("save", function (next) {
  const operation = this.operation;

  // Validate based on action type
  if (operation.action === SuggestionsOperationAction.REPLACE) {
    // REPLACE must have both actual and value
    if (!operation.actual || operation.actual.trim().length === 0) {
      return next(
        new Error(
          "REPLACE operation requires 'actual' field with the original text",
        ),
      );
    }
    if (!operation.value || operation.value.trim().length === 0) {
      return next(
        new Error(
          "REPLACE operation requires 'value' field with the replacement text",
        ),
      );
    }
  } else if (operation.action === SuggestionsOperationAction.ADD) {
    // ADD must have value, actual should be empty
    operation.actual = "";
    if (!operation.value || operation.value.trim().length === 0) {
      return next(new Error("ADD operation requires non-empty 'value' field"));
    }
  } else if (operation.action === SuggestionsOperationAction.REMOVE) {
    // REMOVE should have actual (what's being removed), value should be empty
    operation.value = "";
    if (!operation.actual || operation.actual.trim().length === 0) {
      return next(
        new Error(
          "REMOVE operation requires 'actual' field with the text being removed",
        ),
      );
    }
  }

  next();
});

// Validation after the document is constructed but before save
SuggestionSchema.pre("validate", function (next) {
  // Make sure operation exists
  if (!this.operation) {
    return next(new Error("Operation is required"));
  }

  // Ensure value exists (even if empty string for REMOVE)
  if (this.operation.value === undefined || this.operation.value === null) {
    this.operation.value = "";
  }

  next();
});

export const Suggestion = mongoose.model("Suggestion", SuggestionSchema);

/* 
validate: {
        validator: function (v: string) {
          // Validate path format: either root field or ObjectId-based path
          const rootFieldPattern = /^[a-zA-Z_]+$/;
          const objectIdPathPattern =
            /^[a-zA-Z_]+\._id:[a-f0-9]{24}(\.[a-zA-Z_]+(\._id:[a-f0-9]{24})?)*$/;
          return rootFieldPattern.test(v) || objectIdPathPattern.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid path format. Use 'fieldName' or 'arrayName._id:ObjectId.fieldName'`,
      },
      */
