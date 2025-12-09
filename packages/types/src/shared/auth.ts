export interface OptionalAuthPayload {
  signedIn: boolean;
  userId: string | null;
  sessionId: string | null;
  orgId: string | null;
}

export interface OptionalAuthOptions {
  /**
   * If true, also fetch and attach the full Clerk user object as `req.currentUser`.
   */
  loadUser?: boolean;
}

export type AuthProvider =
  | "email"
  | "google"
  | "linkedin"
  | "oauth_google"
  | "oauth_linkedin";

export interface ClerkUserData {
  id: string;
  email_addresses?: Array<{
    email_address: string;
    id: string;
    verification?: {
      status: string;
    };
  }>;
  first_name?: string;
  last_name?: string;
  image_url?: string;
  external_accounts?: Array<{
    provider: AuthProvider;
    email_address: string;
  }>;
  created_at?: number;
  updated_at?: number;
}
