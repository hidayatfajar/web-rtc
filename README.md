# WebRTC Meeting Application

Aplikasi video conference real-time menggunakan WebRTC, Socket.IO, dan Nuxt 3. Proyek ini terdiri dari dua bagian utama: backend API (Express + Socket.IO) dan frontend aplikasi (Nuxt 3).

## 📋 Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Prasyarat](#prasyarat)
- [Struktur Proyek](#struktur-proyek)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Deployment](#deployment)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)
- [Kontributor](#kontributor)

## 🚀 Fitur Utama

- **Video Conference Real-time**: Komunikasi video dan audio menggunakan WebRTC
- **Screen Sharing**: Berbagi layar dengan peserta lainnya
- **Chat Panel**: Fitur chat dalam meeting
- **Room Management**: Sistem manajemen room untuk multiple meetings
- **Recording Upload**: Upload dan simpan rekaman meeting
- **Responsive Design**: Tampilan yang responsif untuk berbagai device
- **Participant Management**: Kelola peserta dalam room

## 🛠 Teknologi yang Digunakan

### Backend (API)
- **Node.js** v20.19.2
- **Express** v5.2.1
- **Socket.IO** v4.8.3
- **Multer** v2.0.2 (File Upload)
- **CORS** v2.8.5

### Frontend (App)
- **Node.js** v20.19.2
- **Nuxt 3** v3.20.2
- **Vue 3** v3.5.26
- **Nuxt UI** v3.3.7
- **Pinia** v3.0.4 (State Management)
- **Socket.IO Client** v4.8.3

## 📦 Prasyarat

Pastikan Anda telah menginstall:

- **Node.js** v20.19.2 atau lebih tinggi
- **npm** atau **yarn** (package manager)
- **Git** (untuk version control)

Cek versi Node.js:
```bash
node -v
# Output: v20.19.2
```

## 📁 Struktur Proyek

```
web-rtc/
├── api/                    # Backend Server
│   ├── handlers/          # Socket & Upload Handlers
│   ├── recordings/        # Direktori untuk menyimpan rekaman
│   ├── index.js          # Entry point server
│   ├── package.json      # Dependencies backend
│   └── .env              # Environment variables backend
│
├── app/                   # Frontend Application
│   ├── components/       # Vue Components
│   ├── composables/      # Composable functions
│   ├── pages/           # Nuxt pages
│   ├── stores/          # Pinia stores
│   ├── assets/          # Static assets
│   ├── nuxt.config.ts   # Nuxt configuration
│   ├── package.json     # Dependencies frontend
│   └── .env             # Environment variables frontend
│
└── README.md            # Dokumentasi utama (ini)
```

## 💻 Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd web-rtc
```

### 2. Install Dependencies Backend

```bash
cd api
npm install
```

### 3. Install Dependencies Frontend

```bash
cd ../app
npm install
```

## ⚙️ Konfigurasi

### Backend Configuration

1. Copy file `.env.example` menjadi `.env` di folder `api/`:
```bash
cd api
cp .env.example .env
```

2. Edit file `.env` sesuai kebutuhan:
```env
# Server Configuration
PORT=3001
HOST=0.0.0.0

# Base URL (your VPS domain or IP)
BASE_URL=http://localhost:3001

# Allowed Origins (comma-separated, frontend URLs)
ALLOWED_ORIGINS=http://localhost:3000

# Node Environment
NODE_ENV=development
```

### Frontend Configuration

1. Copy file `.env.example` menjadi `.env` di folder `app/`:
```bash
cd app
cp .env.example .env
```

2. Edit file `.env` sesuai kebutuhan:
```env
# Socket.IO Server URL
NUXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Node Environment
NODE_ENV=development

# Server Configuration
PORT=3000
HOST=0.0.0.0
```

## 🚀 Menjalankan Aplikasi

### Development Mode

#### 1. Jalankan Backend Server

```bash
cd api
npm run dev
```

Server akan berjalan di: `http://localhost:3001`

#### 2. Jalankan Frontend Application (Terminal Baru)

```bash
cd app
npm run dev
```

Aplikasi akan berjalan di: `http://localhost:3000`

### Production Mode

#### Backend

```bash
cd api
node index.js
```

#### Frontend

```bash
cd app
npm run build
npm run preview
```

### Menggunakan PM2 (Recommended untuk Production)

Kedua folder (`api` dan `app`) sudah dilengkapi dengan `ecosystem.config.cjs` untuk PM2.

#### Start dengan PM2:

```bash
# Dari folder api
cd api
pm2 start ecosystem.config.cjs

# Dari folder app (terminal baru)
cd app
pm2 start ecosystem.config.cjs
```

#### PM2 Commands:

```bash
pm2 list              # List semua proses
pm2 logs              # Lihat logs
pm2 restart all       # Restart semua aplikasi
pm2 stop all          # Stop semua aplikasi
pm2 delete all        # Hapus semua dari PM2
```

## 🌐 Deployment

### Backend (API Server)

1. **VPS/Dedicated Server**:
   - Upload kode ke server
   - Install dependencies: `npm install`
   - Setup environment variables
   - Jalankan dengan PM2: `pm2 start ecosystem.config.cjs`
   - Setup Nginx sebagai reverse proxy

2. **Environment Variables untuk Production**:
```env
PORT=3001
HOST=0.0.0.0
BASE_URL=https://api.yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com
NODE_ENV=production
```

### Frontend (Nuxt App)

1. **Vercel** (Recommended):
   - Connect repository ke Vercel
   - Set root directory ke `app`
   - Add environment variable: `NUXT_PUBLIC_SOCKET_URL`
   - Deploy

2. **Netlify**:
   - Connect repository
   - Build command: `npm run build`
   - Publish directory: `.output/public`
   - Add environment variables

3. **VPS/Dedicated Server**:
   - Build aplikasi: `npm run build`
   - Jalankan dengan PM2: `pm2 start ecosystem.config.cjs`
   - Setup Nginx untuk serving

## 📡 API Endpoints

### Health Check
```
GET /health
Response: { status: "ok", timestamp: "..." }
```

### Debug Rooms
```
GET /debug/rooms
Response: { "room-id": ["socket-id1", "socket-id2"] }
```

### Upload Recording
```
POST /api/upload-recording
Content-Type: multipart/form-data
Body: { recording: File }
```

### List Recordings
```
GET /api/recordings
Response: ["recording1.webm", "recording2.webm"]
```

### Static Recordings
```
GET /recordings/:filename
Response: File Stream
```

## 🔌 Socket.IO Events

### Client → Server

- `join-room`: Join ke room tertentu
- `leave-room`: Keluar dari room
- `offer`: Kirim WebRTC offer
- `answer`: Kirim WebRTC answer
- `ice-candidate`: Kirim ICE candidate
- `send-message`: Kirim chat message
- `update-media-state`: Update status audio/video
- `start-screen-share`: Mulai screen sharing
- `stop-screen-share`: Stop screen sharing

### Server → Client

- `user-joined`: Notifikasi user baru join
- `user-left`: Notifikasi user keluar
- `offer`: Menerima WebRTC offer
- `answer`: Menerima WebRTC answer
- `ice-candidate`: Menerima ICE candidate
- `receive-message`: Menerima chat message
- `room-users`: List users dalam room
- `media-state-updated`: Update status media user
- `screen-share-started`: Notifikasi screen share dimulai
- `screen-share-stopped`: Notifikasi screen share dihentikan

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### CORS Error

Pastikan `ALLOWED_ORIGINS` di backend mencakup URL frontend Anda.

### Socket.IO Connection Failed

1. Cek apakah backend server berjalan
2. Verifikasi `NUXT_PUBLIC_SOCKET_URL` di frontend `.env`
3. Pastikan tidak ada firewall yang memblokir port

### WebRTC Connection Issues

1. Pastikan menggunakan HTTPS di production (required untuk WebRTC)
2. Configure STUN/TURN servers jika perlu untuk NAT traversal
3. Cek browser permissions untuk camera/microphone

### Build Error

```bash
# Clear cache dan reinstall
rm -rf node_modules package-lock.json
npm install
```

## 👨‍💻 Kontributor

- **Fajar Nur Hidayat** - Developer

## 📝 License

ISC License

## 📞 Support

Untuk pertanyaan atau issues, silakan buat issue di repository ini.

---

**Happy Coding! 🚀**
