import mongoose, { Schema, Document } from "mongoose";
import {
  UserAuthProvider,
  UserSubscription,
  UserProfile,
  UserSettings,
  UserStats,
} from "@visume/types";

export interface IUser extends Document {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  emailVerified: boolean;
  authProviders: UserAuthProvider[];
  subscription: UserSubscription;
  profile: UserProfile;
  settings: UserSettings;
  stats: UserStats;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    firstName: String,
    lastName: String,
    imageUrl: String,
    emailVerified: {
      type: Boolean,
      default: false,
    },
    authProviders: [
      {
        provider: {
          type: String,
        },
        email: String,
      },
    ],
    subscription: {
      tier: {
        type: String,
        default: "free",
      },
      validUntil: Date,
      creditsRemaining: {
        type: Number,
        default: 10,
      },
      monthlyCredits: {
        type: Number,
        default: 10,
      },
    },
    profile: {
      title: String,
      industry: String,
      experience: String,
      location: String,
      skills: [String],
      targetRoles: [String],
    },
    settings: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      weeklyReport: {
        type: Boolean,
        default: false,
      },
      autoSave: {
        type: Boolean,
        default: true,
      },
      aiSuggestions: {
        type: Boolean,
        default: true,
      },
    },
    stats: {
      resumesCreated: {
        type: Number,
        default: 0,
      },
      jobsAnalyzed: {
        type: Number,
        default: 0,
      },
      applicationsTracked: {
        type: Number,
        default: 0,
      },
      lastActive: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ "subscription.tier": 1 });
UserSchema.index({ createdAt: -1 });

export const User = mongoose.model<IUser>("User", UserSchema);
