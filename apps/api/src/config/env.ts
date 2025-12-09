import dotenv from "dotenv";
import path from "path";

function loadEnvironment() {
  // Determine which env file to load
  const nodeEnv = process.env.NODE_ENV || "development";

  // Skip .env loading in production environments (Railway, Render, etc.)
  if (nodeEnv === "production") {
    console.log(
      "✓ Running in production mode - using platform environment variables",
    );
    return;
  }

  const envFile = nodeEnv === "test" ? ".env.test" : ".env.development";
  const envPath = path.resolve(process.cwd(), envFile);

  // Attempt to load environment variables (won't crash if file doesn't exist)
  try {
    const result = dotenv.config({ path: envPath });

    if (result.error) {
      // Check if error is due to missing file
      if (result.error.message.includes("ENOENT")) {
        console.log(
          ` No ${envFile} file found - using system environment variables`,
        );
      } else {
        console.warn(`⚠️  Warning loading ${envFile}:`, result.error.message);
      }
    } else {
      console.log(`✓ Environment loaded from: ${envFile}`);
    }
  } catch (error) {
    // Gracefully handle any dotenv errors
    console.log("Using system environment variables");
  }
}

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const required = [
    "MONGODB_URI",
    "CLERK_SECRET_KEY",
    "CLERK_WEBHOOK_SECRET",
    "OPENAI_API_KEY",
    "FIRECRAWL_API_KEY",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variables:\n` +
        missing.map((key) => `   - ${key}`).join("\n"),
    );
    console.error(
      `\nFor local development: Create a .env.development file with these variables` +
        `\nFor production (Railway/Render): Set these in your platform dashboard`,
    );
    throw new Error("Missing required environment variables");
  }

  console.log("✓ All required environment variables are set");
}

// Load environment immediately when this module is imported
loadEnvironment();
validateEnvironment();

// Export configuration object for convenience
export const config = {
  // Environment
  nodeEnv: process.env.NODE_ENV || "development",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",

  // Server
  port: parseInt(process.env.PORT || "4000", 10),
  host: process.env.HOST || "0.0.0.0",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // Database
  mongoUri: process.env.MONGODB_URI!,
  redisUrl: process.env.REDIS_URL,
  redisPassword: process.env.REDIS_PASSWORD,

  // Authentication
  clerkSecretKey: process.env.CLERK_SECRET_KEY!,
  clerkWebhookSecret: process.env.CLERK_WEBHOOK_SECRET!,

  // AI Services
  openAiApiKey: process.env.OPENAI_API_KEY!,
  firecrawlApiKey: process.env.FIRECRAWL_API_KEY,

  // Email
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM,
  },

  // Logging
  logging: {
    dir: process.env.LOG_DIR || "logs",
    level: process.env.LOG_LEVEL || "info",
  },
} as const;

export default config;
