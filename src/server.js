import express from "express";
import os from "os";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import predictionsRouter from "./routes/predictions.js"; // ✅ active route
import "./services/predictionScheduler.js"; // scheduler
dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// ===========================================
// Backend Health Check Route
// ===========================================
app.get("/api/status", (req, res) => {
  // Calculate uptime in hours/minutes
  const uptimeSeconds = process.uptime();
  const uptimeHours = Math.floor(uptimeSeconds / 3600);
  const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);

  // Get memory usage
  const memoryUsageMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);

  // Calculate average CPU load (1-minute average)
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
      hostname: os.hostname()
    },
    endpoints: [
      "/api/predictions",
      "/api/predictions/week/:season/:week"
    ]
  });
});



// Root endpoint (sanity check)
app.get("/", (req, res) => {
  res.json({ success: true, message: "StatMind Sports API is running" });
});

// Predictions endpoints
app.use("/api/predictions", predictionsRouter);

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`✅ StatMind Sports API running on port ${PORT}`)
);
