const path = require('path')

const ROOT_DIR = __dirname

module.exports = {
  apps: [
    {
      name: 'wa-backend',
      script: 'server.js',
      cwd: path.join(ROOT_DIR, 'backend'),
      watch: false,
      autorestart: true,
      max_restarts: 50,
      min_uptime: 5000,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'production',
        PORT: 8098,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: path.join(ROOT_DIR, 'backend', 'server.err.log'),
      out_file: path.join(ROOT_DIR, 'backend', 'server.out.log'),
      merge_logs: true,
    },
    {
      name: 'wa-frontend',
      script: path.join(ROOT_DIR, 'frontend', 'node_modules', 'vite', 'bin', 'vite.js'),
      args: '--host',
      cwd: path.join(ROOT_DIR, 'frontend'),
      interpreter: 'node',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: 5000,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'development',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: path.join(ROOT_DIR, 'frontend', 'vite.err.log'),
      out_file: path.join(ROOT_DIR, 'frontend', 'vite.out.log'),
      merge_logs: true,
    },
  ],
}
