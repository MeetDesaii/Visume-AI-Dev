import { Server } from "http";
import mongoose from "mongoose";
import { logger } from "./logger";

export const gracefulShutdown = async (server: Server) => {
  logger.info("SIGTERM signal received: closing HTTP server");

  server.close(async () => {
    logger.info("HTTP server closed");

    // Close database connections
    try {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed");
    } catch (error) {
      logger.error(error, "Error during shutdown:");
    }

    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error(
      "Could not close connections in time, forcefully shutting down",
    );
    process.exit(1);
  }, 30000);
};
