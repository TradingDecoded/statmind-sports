// ===============================
//  StatMind Sports - API Server
//  Phase 9: Performance Optimized (No Sentry)
// ===============================

import express from "express";
import os from "os";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import winston from "winston";
import compression from "compression";
import predictionsRouter from "./routes/predictions.js";
import statsRoutes from "./routes/stats.js";
import "./services/predictionScheduler.js";
import adminRouter from "./routes/admin.js";
import analyticsRouter from "./routes/analytics.js";
import authRoutes from './routes/auth.js';
import parlayRoutes from './routes/parlay.js';
import usersRoutes from './routes/users.js';
import './jobs/resolveParlays.js';
import leaderboardRoutes from './routes/leaderboard.js';
import notificationsRoutes from './routes/notifications.js';
import smsBucksRoutes from './routes/smsBucks.js';
import competitionRoutes from './routes/competition.js';
import adminManagementRoutes from './routes/adminManagement.js';
import testModeRoutes from './routes/testMode.js';
import feedbackRoutes from './routes/feedback.js';

dotenv.config();
const app = express();

// ======================================
// Winston Logger Setup
// ======================================
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: "/var/log/statmind/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "/var/log/statmind/combined.log",
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

// ======================================
// Express Middleware
// ======================================

// ✅ Enable gzip compression
app.use(compression());

// ✅ Restrict CORS in production, open in dev
// ✅ Allow all origins for development
app.use(cors({
  origin: ['https://statmindsports.com', 'http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Security headers
app.use(helmet());

// ✅ Parse JSON requests
app.use(express.json());

// ✅ Smart cache headers for GET requests
app.use((req, res, next) => {
  if (req.method === "GET" && req.path.startsWith("/api/")) {
    if (req.path.includes("accuracy")) {
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
    } else {
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60");
    }
  }
  next();
});

// ✅ Logging with Winston via morgan
app.use(
  morgan("tiny", {
    stream: { write: (msg) => logger.info(msg.trim()) },
  })
);

// ======================================
// Health Check Endpoint
// ======================================
app.get("/api/status", (req, res) => {
  const uptimeSeconds = process.uptime();
  const uptimeHours = Math.floor(uptimeSeconds / 3600);
  const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);
  const memoryUsageMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
  const cpuLoad = os.loadavg()[0].toFixed(2);

  res.json({
    success: true,
    service: "StatMind Sports API",
    version: "1.0.0",
    time: new Date().toISOString(),
    system: {
      uptime: `${uptimeHours}h ${uptimeMinutes}m`,
      memory: `${memoryUsageMB} MB`,
      cpu_load: `${cpuLoad}`,
      platform: os.platform(),
      hostname: os.hostname(),
    },
    endpoints: [
      "/api/predictions",
      "/api/predictions/week/:season/:week",
      "/api/predictions/upcoming",
    ],
  });
});

// ======================================
// Root Endpoint
// ======================================
app.get("/", (req, res) => {
  res.json({ success: true, message: "StatMind Sports API is running" });
});

// ======================================
// Predictions Route
// ======================================
app.use("/api/predictions", predictionsRouter);
app.use("/api/stats", statsRoutes);
app.use("/api/admin", adminRouter);
app.use("/api/analytics", analyticsRouter);
app.use('/api/auth', authRoutes);
app.use('/api/parlay', parlayRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/sms-bucks', smsBucksRoutes);
app.use('/api/competition', competitionRoutes);
app.use('/api/admin/management', adminManagementRoutes);
app.use('/api/test-mode', testModeRoutes);
app.use('/api/feedback', feedbackRoutes);

// ======================================
// Start Server
// ======================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  logger.info(`✅ StatMind Sports API running on port ${PORT}`);
  console.log(`✅ StatMind Sports API running on port ${PORT}`);
});
