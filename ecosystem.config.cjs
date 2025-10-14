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
      script: "./src/server.js", // ✅ Corrected path
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
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "500M",
      autorestart: true,
      restart_delay: 5000,
      watch: false,
      out_file: "/var/log/pm2/frontend.out.log",
      error_file: "/var/log/pm2/frontend.err.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
