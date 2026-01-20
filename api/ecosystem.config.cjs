module.exports = {
  apps: [
    {
      name: 'webrtc-api',
      script: 'index.js',
      instances: 1, // WebRTC/Socket.IO butuh sticky session, jadi 1 instance
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        HOST: '0.0.0.0',
        BASE_URL: 'http://localhost:3001',
        ALLOWED_ORIGINS: 'http://localhost:3000',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0',
        // Ganti dengan domain VPS kamu
        BASE_URL: 'https://api.yourdomain.com',
        ALLOWED_ORIGINS: 'https://yourdomain.com,https://www.yourdomain.com',
      },
    },
  ],
};
