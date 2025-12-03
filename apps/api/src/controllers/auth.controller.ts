import { NextFunction, Request, Response } from "express";
import { Webhook } from "svix";
import { UserJSON, WebhookEvent } from "@clerk/express";
import { User } from "@visume/database";
import { VerifySessionResponse, WebhookAckResponse } from "@visume/types";
import { logger } from "../utils/logger";
import * as emailService from "../services/email.service";
import { AppError } from "../middleware/error.middleware";

// Handle Clerk webhook events
export async function handleWebhook(
  req: Request,
  res: Response<WebhookAckResponse>,
): Promise<void> {
  try {
    const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
    const headers = {
      "svix-id": req.headers["svix-id"] as string,
      "svix-timestamp": req.headers["svix-timestamp"] as string,
      "svix-signature": req.headers["svix-signature"] as string,
    };

    const event = webhook.verify(
      JSON.stringify(req.body),
      headers,
    ) as WebhookEvent;

    switch (event.type) {
      case "user.created":
        await handleUserCreated(event.data);
        break;
      case "user.updated":
        await handleUserUpdated(event.data);
        break;
      case "user.deleted":
        await handleUserDeleted(event.data);
        break;
      case "session.created":
        await handleSessionCreated(event.data);
        break;
    }

    res.status(200).json({
      success: true,
      data: { received: true },
    });
  } catch (error) {
    logger.error(error, "Webhook error:");
    res.status(400).json({
      success: false,
      error: "Webhook processing failed",
    });
  }
}

async function handleUserCreated(data: UserJSON): Promise<void> {
  try {
    const user = await User.create({
      clerkId: data.id,
      email: data.email_addresses[0]?.email_address,
      emailVerified:
        data.email_addresses[0]?.verification?.status === "verified",
      firstName: data.first_name,
      lastName: data.last_name,
      imageUrl: data.image_url,
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

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.firstName);

    logger.info(`New user created: ${user.email}`);
  } catch (error) {
    logger.error(error, "User creation error:");
  }
}

async function handleUserUpdated(data: any): Promise<void> {
  try {
    await User.findOneAndUpdate(
      { clerkId: data.id },
      {
        email: data.email_addresses[0].email_address,
        firstName: data.first_name,
        lastName: data.last_name,
        imageUrl: data.image_url,
      },
    );
  } catch (error) {
    logger.error(error, "User update error:");
  }
}

async function handleUserDeleted(data: any): Promise<void> {
  try {
    await User.findOneAndDelete({ clerkId: data.id });
    logger.info(`User deleted: ${data.id}`);
  } catch (error) {
    logger.error(error, "User deletion error:");
  }
}

async function handleSessionCreated(data: any): Promise<void> {
  try {
    await User.findOneAndUpdate(
      { clerkId: data.user_id },
      {
        "stats.lastActive": new Date(),
      },
    );
  } catch (error) {
    logger.error(error, "Session update error:");
  }
}

// Verify session
export async function verifySession(
  req: Request,
  res: Response<VerifySessionResponse>,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.auth.userId;
    const user = await User.findOne({ clerkId: userId });

    if (!user) return next(new AppError(404, "User not found"));

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id as string,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          subscription: user.subscription,
        },
      },
    });
  } catch (error) {
    logger.error(error, "Session verification error:");
    res.status(500).json({
      success: false,
      error: "Session verification failed",
    });
  }
}
