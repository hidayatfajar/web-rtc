module.exports = {
  apps: [
    {
      name: 'webrtc-frontend',
      script: './.output/server/index.mjs',
      instances: 'max', // Gunakan semua CPU cores
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
        NUXT_PUBLIC_SOCKET_URL: 'https://api.rekrutmen-traspac.web.id' // Ganti dengan domain API Anda
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOST: '0.0.0.0',
        NUXT_PUBLIC_SOCKET_URL: 'https://api.rekrutmen-traspac.web.id'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M',
      watch: false,
    }
  ]
};
