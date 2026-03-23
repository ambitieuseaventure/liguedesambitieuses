module.exports = {
  apps: [
    {
      name: 'ligue-des-ambitieuses',
      script: 'api/index.js',
      cwd: '/var/www/ligue/liguedesambitieuses',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/ligue-des-ambitieuses/error.log',
      out_file: '/var/log/ligue-des-ambitieuses/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '500M',
      autorestart: true,
      watch: false
    }
  ]
};
