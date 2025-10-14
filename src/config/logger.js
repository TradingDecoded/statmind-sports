import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "/var/log/statmind/error.log", level: "error" }),
    new winston.transports.File({ filename: "/var/log/statmind/combined.log" })
  ]
});

// In dev, also show pretty console output
if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
