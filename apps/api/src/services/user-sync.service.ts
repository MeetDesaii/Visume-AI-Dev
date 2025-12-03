import { User } from "@visume/database";
import { AuthProvider, ClerkUserData } from "@visume/types";
import { logger } from "../utils/logger";

export async function createUser(clerkData: ClerkUserData): Promise<void> {
  try {
    const primaryEmail = clerkData.email_addresses?.[0];

    if (!primaryEmail) {
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ clerkId: clerkData.id });
    if (existingUser) {
      return;
    }

    // Determine auth providers
    const authProviders: Array<{
      provider: AuthProvider;
      email?: string;
    }> = [];

    // Check for OAuth providers
    if (clerkData.external_accounts && clerkData.external_accounts.length > 0) {
      clerkData.external_accounts.forEach((account) => {
        if (account.provider === "oauth_google") {
          authProviders.push({
            provider: "oauth_google",
            email: account.email_address,
          });
        } else if (account.provider === "oauth_linkedin") {
          authProviders.push({
            provider: "oauth_linkedin",
            email: account.email_address,
          });
        }
      });
    } else {
      // Default to email provider
      authProviders.push({
        provider: "email",
        email: primaryEmail.email_address,
      });
    }

    const user = await User.create({
      clerkId: clerkData.id,
      email: primaryEmail.email_address.toLowerCase(),
      firstName: clerkData.first_name || "",
      lastName: clerkData.last_name || "",
      imageUrl: clerkData.image_url || "",
      emailVerified: primaryEmail.verification?.status === "verified",
      authProviders,
      subscription: {
        tier: "free",
        creditsRemaining: 10,
        monthlyCredits: 10,
      },
      settings: {
        emailNotifications: true,
        weeklyReport: false,
        autoSave: true,
        aiSuggestions: true,
      },
      stats: {
        resumesCreated: 0,
        jobsAnalyzed: 0,
        applicationsTracked: 0,
        lastActive: new Date(),
      },
    });

    logger.info(
      `[UserSyncService] ✅ User created successfully in MongoDB: ${user.clerkId} (${user.email})`,
    );
  } catch (error) {
    logger.error(error, "[UserSyncService] ❌ Error creating user:");
    if (error instanceof Error) {
      logger.error(`[UserSyncService] Error message: ${error.message}`);
      logger.error(`[UserSyncService] Error stack: ${error.stack}`);
    }
    throw error;
  }
}

export async function updateUser(clerkData: ClerkUserData): Promise<void> {
  try {
    const primaryEmail = clerkData.email_addresses?.[0];

    if (!primaryEmail) {
      logger.error("No email found in Clerk user data");
      return;
    }

    // Build update object
    const updateData: any = {
      email: primaryEmail.email_address.toLowerCase(),
      emailVerified: primaryEmail.verification?.status === "verified",
    };

    if (clerkData.first_name) updateData.firstName = clerkData.first_name;
    if (clerkData.last_name) updateData.lastName = clerkData.last_name;
    if (clerkData.image_url) updateData.imageUrl = clerkData.image_url;

    // Update auth providers if external accounts changed
    if (clerkData.external_accounts && clerkData.external_accounts.length > 0) {
      const authProviders: Array<{
        provider: AuthProvider;
        email?: string;
      }> = [];

      clerkData.external_accounts.forEach((account) => {
        if (account.provider === "oauth_google") {
          authProviders.push({
            provider: "oauth_google",
            email: account.email_address,
          });
        } else if (account.provider === "oauth_linkedin") {
          authProviders.push({
            provider: "oauth_linkedin",
            email: account.email_address,
          });
        }
      });

      if (authProviders.length > 0) {
        updateData.authProviders = authProviders;
      }
    }

    const user = await User.findOneAndUpdate(
      { clerkId: clerkData.id },
      { $set: updateData },
      { new: true },
    );

    if (user) {
      logger.info(`User updated successfully: ${user.clerkId} (${user.email})`);
    } else {
      logger.warn(`User not found for update: ${clerkData.id}`);
    }
  } catch (error) {
    logger.error(error, "Error updating user");
    throw error;
  }
}

export async function deleteUser(clerkId: string): Promise<void> {
  try {
    const user = await User.findOneAndDelete({ clerkId });

    if (user) {
      logger.info(`User deleted successfully: ${user.clerkId} (${user.email})`);
    } else {
      logger.warn(`User not found for deletion: ${clerkId}`);
    }
  } catch (error) {
    logger.error(error, "Error deleting user:");
    throw error;
  }
}
