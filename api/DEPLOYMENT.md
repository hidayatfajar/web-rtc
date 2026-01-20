# 🚀 Deployment Guide - WebRTC API Server

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
cd /var/www/webrtc-app/api

# Atau via SCP
scp -r ./api user@your-vps-ip:/var/www/webrtc-app/
```

## Step 2: Setup Environment

```bash
cd /var/www/webrtc-app/api

# Install dependencies
npm install --production

# Copy dan edit environment file
cp .env.example .env
nano .env
```

Edit `.env` sesuai konfigurasi VPS kamu:

```env
PORT=3001
HOST=0.0.0.0
BASE_URL=https://api.yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
NODE_ENV=production
```

## Step 3: Jalankan dengan PM2

```bash
# Start dengan ecosystem config (production)
pm2 start ecosystem.config.cjs --env production

# Atau start manual
pm2 start index.js --name webrtc-api

# Save PM2 config (auto-start saat reboot)
pm2 save
pm2 startup
```

### PM2 Commands Berguna:

```bash
pm2 status          # Lihat status
pm2 logs webrtc-api # Lihat logs
pm2 restart webrtc-api
pm2 stop webrtc-api
pm2 monit           # Monitor realtime
```

## Step 4: Setup Nginx Reverse Proxy

Install Nginx:
```bash
sudo apt update
sudo apt install nginx
```

Buat config file:
```bash
sudo nano /etc/nginx/sites-available/webrtc-api
```

Isi dengan:

```nginx
# Upstream untuk load balancing (optional)
upstream webrtc_api {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name api.yourdomain.com;  # Ganti dengan domain kamu

    # Redirect HTTP to HTTPS (uncomment setelah setup SSL)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://webrtc_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeout settings
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Serve recordings with caching
    location /recordings {
        proxy_pass http://webrtc_api/recordings;
        proxy_cache_valid 200 1d;
        add_header Cache-Control "public, max-age=86400";
    }
}
```

Aktifkan config:
```bash
sudo ln -s /etc/nginx/sites-available/webrtc-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 5: Setup SSL dengan Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

Setelah SSL aktif, update `.env`:
```env
BASE_URL=https://api.yourdomain.com
```

Dan restart PM2:
```bash
pm2 restart webrtc-api
```

## Step 6: Firewall Setup

```bash
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw enable
```

## 🔧 Troubleshooting

### Check if server running:
```bash
curl http://localhost:3001/health
```

### Check PM2 logs:
```bash
pm2 logs webrtc-api --lines 100
```

### Check Nginx errors:
```bash
sudo tail -f /var/log/nginx/error.log
```

### WebSocket not working?
Pastikan header `Upgrade` dan `Connection` di-forward dengan benar di Nginx config.

---

## 📁 Struktur File Production

```
/var/www/webrtc-app/
├── api/
│   ├── index.js
│   ├── package.json
│   ├── .env
│   ├── ecosystem.config.cjs
│   └── recordings/        # Auto-created
└── fe/                    # Nuxt frontend (deploy terpisah)
```
