module.exports = {
  apps: [
    {
      name: 'wa-sender-backend',
      script: 'server.js',
      cwd: __dirname,
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'production',
        PORT: 8090,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'server.err.log',
      out_file: 'server.out.log',
      merge_logs: true,
    },
  ],
}
