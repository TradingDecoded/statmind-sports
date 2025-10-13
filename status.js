import os from "os";

export default function handler(req, res) {
  const uptimeSeconds = process.uptime();
  const uptimeHours = Math.floor(uptimeSeconds / 3600);
  const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);
  const memoryUsageMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
  const cpuLoad = os.loadavg()[0].toFixed(2);

  res.status(200).json({
    success: true,
    frontend: "StatMind Sports Frontend",
    version: "1.0.0",
    time: new Date().toISOString(),
    system: {
      uptime: `${uptimeHours}h ${uptimeMinutes}m`,
      memory: `${memoryUsageMB} MB`,
      cpu_load: `${cpuLoad}`,
      platform: os.platform(),
      hostname: os.hostname()
    }
  });
}
