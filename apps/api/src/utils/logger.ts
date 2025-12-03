import pino from "pino";
import path from "path";
import fs from "fs";
import config from "../config/env";

const logDir = config.logging.level || "logs";

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const isProduction = process.env.NODE_ENV === "production";
const logLevel = process.env.LOG_LEVEL || "info";

// Create pino logger with multiple transports
const logger = pino(
  {
    level: logLevel,
    base: {
      service: "visume-ai",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
  },
  pino.multistream([
    // Console output with pretty formatting in development
    {
      level: logLevel,
      stream: isProduction
        ? process.stdout
        : pino.transport({
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
              ignore: "pid,hostname",
              singleLine: false,
              messageFormat: "{service} - {msg}",
              customColors: "info:blue,warn:yellow,error:red",
              customLevels: "info:30,warn:40,error:50",
            },
          }),
    },
    // Write all logs to combined.log
    {
      level: logLevel,
      stream: pino.destination({
        dest: path.join(logDir, "combined.log"),
        sync: false,
      }),
    },
    // Write error logs to error.log
    {
      level: "error",
      stream: pino.destination({
        dest: path.join(logDir, "error.log"),
        sync: false,
      }),
    },
  ]),
);

export { logger };
