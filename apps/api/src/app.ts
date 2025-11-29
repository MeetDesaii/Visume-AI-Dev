/// <reference types="./types/express" />

import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";

import { connectDatabase } from "./config/database";
import { initializeServices } from "./config/initilize";
import { logger } from "./utils/logger";
import { errorHandler } from "./middleware/error.middleware";

// Import routes
import authRoutes from "./routes/auth.routes";
import resumeRoutes from "./routes/resume.routes";
import verificationRoutes from "./routes/verification.routes";
import jobsRoutes from "./routes/job.routes";

function initializeMiddlewares(app: Application): void {
  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        const allowedOrigins = [
          process.env.FRONTEND_URL || "http://localhost:3000",
          "http://localhost:3000",
          "http://localhost:5173",
        ];

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-clerk-session",
        "X-Requested-With",
      ],
    })
  );

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Logging
  app.use(
    morgan("dev", {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  );

  // Global rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    message: "Too many requests from this IP, please try again later.",
  });
  app.use("/api", limiter);

  // Trust proxy
  app.set("trust proxy", 1);
}

function initializeRoutes(app: Application): void {
  // Health check
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  });

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/jobs", jobsRoutes);
  app.use("/api/resumes", resumeRoutes);
  app.use("/api/verify", verificationRoutes);

  // API documentation
  app.get("/api", (req, res) => {
    res.json({
      name: "Resume AI Assistant API",
      version: "1.0.0",
    });
  });
}

function initializeErrorHandling(app: Application): void {
  app.use(errorHandler);
}

export function createApp(): Application {
  const app = express();
  initializeMiddlewares(app);
  initializeRoutes(app);
  initializeErrorHandling(app);
  return app;
}

export async function initializeApp(): Promise<void> {
  await connectDatabase();
  await initializeServices();
}
