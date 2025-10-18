// ==============================================
//  StatMind Sports - PM2 Ecosystem Configuration
//  Phase 9: Clustered, Memory-Capped, Version-Controlled
// ==============================================
const os = require("os");
module.exports = {
  apps: [
    // ===============================
    // Backend (Express API)
    // ===============================
    {
      name: "statmind-backend",
      script: "./src/server.js",
      exec_mode: "cluster",
      instances: Math.max(1, os.cpus().length - 1), // use all but 1 core
      env: {
        NODE_ENV: "production",
        PORT: 4000,
        NODE_OPTIONS: "--max-old-space-size=512",
      },
      max_memory_restart: "500M",    // auto-restart if >500 MB
      autorestart: true,
      restart_delay: 5000,           // wait 5 s between restarts
      watch: false,
      out_file: "/var/log/pm2/backend.out.log",
      error_file: "/var/log/pm2/backend.err.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
    // ===============================
    // Frontend (Next.js)
    // ===============================
    {
      name: "statmind-frontend",
      cwd: "./frontend",
      script: "npm",
      args: "start",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: 3001
      },
      max_memory_restart: "500M",
      autorestart: true,
      restart_delay: 5000,
      watch: false,
      out_file: "/var/log/pm2/frontend.out.log",
      error_file: "/var/log/pm2/frontend.err.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
    // ===============================
    // Monthly SMS Bucks Allocation
    // ===============================
    {
      name: "monthly-allocation",
      script: "./src/jobs/monthlyAllocation.js",
      instances: 1,
      exec_mode: "fork",
      cron_restart: "0 0 1 * *", // 1st of month at midnight
      autorestart: false,
      watch: false,
      out_file: "/var/log/pm2/monthly-allocation.out.log",
      error_file: "/var/log/pm2/monthly-allocation.err.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
    // ===============================
    // Weekly Winner Determination
    // ===============================
    {
      name: "weekly-winner",
      script: "./src/jobs/weeklyWinner.js",
      instances: 1,
      exec_mode: "fork",
      cron_restart: "0 7 * * 2", // Every Tuesday at 7:00 AM UTC (2:00 AM ET)
      autorestart: false,
      watch: false,
      out_file: "/var/log/pm2/weekly-winner.out.log",
      error_file: "/var/log/pm2/weekly-winner.err.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
