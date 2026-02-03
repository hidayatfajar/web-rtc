# 🚀 Deployment Guide - Nuxt 3 Frontend

## Prerequisites di VPS

```bash
# Install Node.js (via nvm recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Install PM2 globally
npm install -g pm2
```

## Step 1: Upload Code ke VPS

```bash
# Via Git (recommended)
git clone <your-repo-url> /var/www/webrtc-app
cd /var/www/webrtc-app/fe

# Atau via SCP
scp -r ./fe user@your-vps-ip:/var/www/webrtc-app/
```

## Step 2: Update Konfigurasi untuk Production

Edit `nuxt.config.ts` untuk production:

```typescript
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false }, // Disable di production
  modules: ["nuxt-socket-io", "@nuxt/ui"],
  css: ["~/assets/css/main.css"],
  
  // Runtime config untuk environment variables
  runtimeConfig: {
    public: {
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
    }
  },
  
  colorMode: {
    dataValue: "theme",
    preference: "light",
    fallback: "light",
    classSuffix: "",
  },
  
  io: {
    sockets: [
      {
        name: "main",
        url: process.env.NUXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
      },
    ],
  },
});
```

## Step 3: Buat File Environment

Buat file `.env`:

```bash
cd /var/www/webrtc-app/fe
nano .env
```

Isi `.env`:

```env
# Production Socket.IO Server URL
NUXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com

# Node environment
NODE_ENV=production

# Port untuk Nuxt server (internal)
PORT=3000
HOST=0.0.0.0
```

## Step 4: Build dan Install

```bash
cd /var/www/webrtc-app/fe

# Install dependencies
npm install --production=false

# Build untuk production
npm run build

# Hapus dev dependencies (optional, untuk hemat space)
npm prune --production
```

## Step 5: Buat PM2 Ecosystem Config

Buat file `ecosystem.config.cjs`:

```bash
nano ecosystem.config.cjs
```

Isi dengan:

```javascript
module.exports = {
  apps: [
    {
      name: 'webrtc-frontend',
      script: './.output/server/index.mjs',
      instances: 'max',  // Gunakan semua CPU cores
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
        NUXT_PUBLIC_SOCKET_URL: 'https://api.yourdomain.com'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    }
  ]
};
```

## Step 6: Jalankan dengan PM2

```bash
# Buat folder logs
mkdir -p logs

# Start dengan ecosystem config
pm2 start ecosystem.config.cjs --env production

# Atau start manual
pm2 start .output/server/index.mjs --name webrtc-frontend

# Save PM2 config (auto-start saat reboot)
pm2 save
pm2 startup
```

### PM2 Commands:

```bash
pm2 status                  # Lihat status
pm2 logs webrtc-frontend    # Lihat logs
pm2 restart webrtc-frontend # Restart app
pm2 stop webrtc-frontend    # Stop app
pm2 monit                   # Monitor realtime
pm2 delete webrtc-frontend  # Hapus dari PM2
```

## Step 7: Setup Nginx Reverse Proxy

Buat config file:

```bash
sudo nano /etc/nginx/sites-available/webrtc-frontend
```

Isi dengan:

```nginx
upstream webrtc_frontend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS (uncomment setelah setup SSL)
    # return 301 https://$server_name$request_uri;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;

    location / {
        proxy_pass http://webrtc_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://webrtc_frontend;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

Aktifkan config:

```bash
sudo ln -s /etc/nginx/sites-available/webrtc-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 8: Setup SSL dengan Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Setelah SSL aktif, update `.env`:

```env
NUXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
```

Dan restart PM2:

```bash
pm2 restart webrtc-frontend
```

## Step 9: Firewall Setup (jika belum)

```bash
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw enable
```

## 🔄 Update/Deploy Ulang

Ketika ada perubahan code:

```bash
cd /var/www/webrtc-app/fe

# Pull changes
git pull origin main

# Install dependencies (jika ada perubahan)
npm install

# Rebuild
npm run build

# Restart PM2
pm2 restart webrtc-frontend

# Clear Nginx cache (optional)
sudo systemctl reload nginx
```

## 🔧 Troubleshooting

### Check if server running:
```bash
curl http://localhost:3000
```

### Check PM2 logs:
```bash
pm2 logs webrtc-frontend --lines 100
pm2 logs webrtc-frontend --err --lines 50  # Error logs only
```

### Check Nginx errors:
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Test Nginx config:
```bash
sudo nginx -t
```

### Socket.IO connection issues:
1. Pastikan `NUXT_PUBLIC_SOCKET_URL` di `.env` benar
2. Check CORS settings di API server
3. Verify SSL certificates aktif untuk domain API

### Build failures:
```bash
# Clear cache dan rebuild
rm -rf .nuxt .output node_modules
npm install
npm run build
```

## 📊 Monitoring & Maintenance

### PM2 Monitoring:
```bash
pm2 monit                    # Realtime monitoring
pm2 list                     # List all processes
pm2 describe webrtc-frontend # Detailed info
```

### Check disk space:
```bash
df -h
```

### Check memory usage:
```bash
free -h
```

### Clean old PM2 logs:
```bash
pm2 flush  # Clear all logs
```

## 🚀 Performance Tips

1. **Enable Gzip** - Already configured in Nginx
2. **Use CDN** - Untuk static assets (optional)
3. **PM2 Cluster Mode** - Already configured untuk multi-core
4. **Monitor Memory** - `pm2 monit` untuk cek memory usage
5. **Setup Log Rotation** - PM2 log rotation:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 📁 Struktur File Production

```
/var/www/webrtc-app/
├── api/
│   ├── index.js
│   ├── package.json
│   ├── .env
│   └── ecosystem.config.cjs
└── fe/
    ├── .output/              # Built files (generated)
    │   └── server/
    │       └── index.mjs     # Entry point
    ├── .env                  # Environment config
    ├── ecosystem.config.cjs  # PM2 config
    ├── logs/                 # PM2 logs (auto-created)
    ├── nuxt.config.ts
    ├── package.json
    └── node_modules/
```

## 🔐 Security Checklist

- [ ] Disable devtools di production
- [ ] Setup SSL certificates
- [ ] Configure firewall (ufw)
- [ ] Set proper file permissions
- [ ] Use environment variables untuk sensitive data
- [ ] Enable security headers di Nginx
- [ ] Regular updates: `npm audit fix`
- [ ] Monitor logs untuk suspicious activity

---

## 📞 Quick Commands Reference

```bash
# PM2
pm2 start ecosystem.config.cjs --env production
pm2 restart webrtc-frontend
pm2 logs webrtc-frontend
pm2 monit

# Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl status nginx

# Build
npm run build
npm run preview  # Test production build locally

# Logs
pm2 logs --lines 100
sudo tail -f /var/log/nginx/error.log
```
