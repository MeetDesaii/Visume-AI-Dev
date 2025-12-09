import { User } from "@visume/database";
import { sendCreditsLowNotification } from "../services/email.service";

export async function checkUserCredits(
  user: any,
  required: number,
): Promise<boolean> {
  if (user.subscription.tier === "enterprise") {
    return true; // Unlimited credits for enterprise
  }

  if (user.subscription.tier === "pro") {
    // Check monthly limit
    if (user.subscription.creditsRemaining >= required) {
      return true;
    }
  }

  // Free tier
  if (user.subscription.creditsRemaining >= required) {
    // Send notification if credits are low
    if (user.subscription.creditsRemaining - required <= 2) {
      await sendCreditsLowNotification(
        user.email,
        user.subscription.creditsRemaining - required,
      );
    }
    return true;
  }

  return false;
}

export async function deductCredits(
  userId: string,
  amount: number,
): Promise<void> {
  await User.findByIdAndUpdate(userId, {
    $inc: { "subscription.creditsRemaining": -amount },
  });
}

export async function resetMonthlyCredits(): Promise<void> {
  // Reset credits for all users on monthly basis
  await User.updateMany({ "subscription.tier": { $in: ["free", "pro"] } }, [
    {
      $set: {
        "subscription.creditsRemaining": {
          $cond: {
            if: { $eq: ["$subscription.tier", "pro"] },
            then: 100, // Pro users get 100 credits/month
            else: 10, // Free users get 10 credits/month
          },
        },
      },
    },
  ]);
}
