// src/middleware/clerk.ts
import type { RequestHandler } from "express";
import { clerkClient, getAuth, requireAuth } from "@clerk/express";
import { OptionalAuthOptions, OptionalAuthPayload } from "@visume/types";
import config from "./env";

// Explicit annotation avoids TS2742 "cannot be named" errors
export const clerkAuth: RequestHandler = requireAuth();

export const clerkOptionalAuth: RequestHandler = createOptionalAuth({
  loadUser: true,
});

function createOptionalAuth(opts: OptionalAuthOptions = {}): RequestHandler {
  const { loadUser = false } = opts;

  const middleware: RequestHandler = async (req, _res, next) => {
    const { userId, sessionId, orgId } = getAuth(req);

    // Minimal payload that doesn't require global type augmentation if you prefer res.locals
    (req as any).authOptional = {
      signedIn: !!userId,
      userId: userId ?? null,
      sessionId: sessionId ?? null,
      orgId: orgId ?? null,
    } as OptionalAuthPayload;

    if (loadUser && userId) {
      try {
        // You can narrow the type via @clerk/types if you install it; kept as unknown here for portability.
        const user = await clerkClient.users.getUser(userId);
        (req as any).currentUser = user as unknown;
      } catch {
        // Swallow user-load errors; optional means we don't fail the request.
        (req as any).currentUser = null;
      }
    }

    next();
  };

  return middleware;
}

export const initializeClerk = async (): Promise<void> => {
  if (!config.clerkSecretKey) {
    throw new Error("CLERK_SECRET_KEY is not configured");
  }
};
