module.exports = {
  apps: [{
    name: 'statmind-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/root/statmind-sports/frontend',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    max_memory_restart: '500M',
    error_file: '/var/log/statmind/frontend-error.log',
    out_file: '/var/log/statmind/frontend-out.log',
    time: true
  }]
};
