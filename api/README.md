# WebRTC Meeting API Server

Backend server untuk aplikasi WebRTC Meeting menggunakan Express.js dan Socket.IO. Server ini menangani signaling untuk WebRTC connections, room management, file uploads, dan real-time messaging.

## 📋 Daftar Isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Prasyarat](#prasyarat)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Menjalankan Server](#menjalankan-server)
- [API Documentation](#api-documentation)
- [Socket.IO Events](#socketio-events)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## ✨ Fitur

- **WebRTC Signaling Server**: Handle offer/answer/ICE candidates exchange
- **Room Management**: Multiple meeting rooms dengan isolasi peserta
- **Real-time Chat**: Chat messaging dalam meeting room
- **File Upload**: Upload dan simpan rekaman meeting
- **Screen Sharing**: Support untuk screen sharing signaling
- **Media State Management**: Track status audio/video setiap peserta
- **CORS Configuration**: Flexible CORS untuk multiple origins
- **Health Check Endpoint**: Monitor status server
- **Debug Tools**: Debug endpoint untuk monitoring rooms

## 🛠 Teknologi

- **Runtime**: Node.js v20.19.2
- **Framework**: Express v5.2.1
- **Real-time Communication**: Socket.IO v4.8.3
- **File Upload**: Multer v2.0.2
- **Environment Variables**: dotenv v17.2.3
- **CORS**: cors v2.8.5
- **Development Tool**: nodemon v3.1.11

## 📦 Prasyarat

- Node.js v20.19.2 atau lebih tinggi
- npm (sudah include dengan Node.js)

Verifikasi instalasi:
```bash
node -v
# Output: v20.19.2

npm -v
# Output: 10.x.x atau lebih tinggi
```

## 💻 Instalasi

### 1. Masuk ke Direktori API

```bash
cd api
```

### 2. Install Dependencies

```bash
npm install
```

Dependencies yang akan terinstall:
- `express`: ^5.2.1 - Web framework
- `socket.io`: ^4.8.3 - Real-time bidirectional communication
- `socket.io-client`: ^4.8.3 - Client untuk testing
- `cors`: ^2.8.5 - CORS middleware
- `dotenv`: ^17.2.3 - Environment variables
- `multer`: ^2.0.2 - Multipart/form-data handling
- `nodemon`: ^3.1.11 - Auto-restart development server

## ⚙️ Konfigurasi

### Environment Variables

1. Copy file `.env.example`:
```bash
cp .env.example .env
```

2. Edit file `.env`:

```env
# Server Configuration
PORT=3001                    # Port untuk server (default: 3001)
HOST=0.0.0.0                # Host binding (0.0.0.0 untuk semua interface)

# Base URL
BASE_URL=http://localhost:3001

# Allowed Origins (comma-separated)
# Development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002

# Production example:
# ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Node Environment
NODE_ENV=development        # development | production
```

### Penjelasan Environment Variables

| Variable | Deskripsi | Default | Required |
|----------|-----------|---------|----------|
| `PORT` | Port server akan berjalan | 3001 | No |
| `HOST` | Host binding address | 0.0.0.0 | No |
| `BASE_URL` | Base URL server | http://localhost:3001 | No |
| `ALLOWED_ORIGINS` | Frontend URLs yang diizinkan (comma-separated) | http://localhost:3000 | Yes |
| `NODE_ENV` | Environment mode | development | No |

## 🚀 Menjalankan Server

### Development Mode

```bash
npm run dev
```

Server akan berjalan dengan nodemon dan auto-restart saat ada perubahan file.

Output:
```
[nodemon] starting `node index.js`
🚀 Server listening on http://localhost:3001
📡 Socket.IO ready for connections
✅ CORS enabled for: http://localhost:3000
```

### Production Mode

```bash
node index.js
```

### Menggunakan PM2 (Recommended untuk Production)

```bash
# Install PM2 globally (jika belum)
npm install -g pm2

# Start server dengan PM2
pm2 start ecosystem.config.cjs

# Atau langsung
pm2 start index.js --name "webrtc-api"
```

PM2 Commands:
```bash
pm2 list                    # List semua proses
pm2 logs webrtc-api        # Lihat logs
pm2 restart webrtc-api     # Restart server
pm2 stop webrtc-api        # Stop server
pm2 delete webrtc-api      # Remove dari PM2
pm2 monit                  # Monitor real-time
```

## 📡 API Documentation

### REST Endpoints

#### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "Senin, 3 Februari 2026 pukul 14.30.45",
  "uptime": 3600,
  "environment": "development"
}
```

#### 2. Debug Rooms (Development Only)
```http
GET /debug/rooms
```

**Response:**
```json
{
  "room-123": ["socket-id-1", "socket-id-2"],
  "room-456": ["socket-id-3"]
}
```

#### 3. Upload Recording
```http
POST /api/upload-recording
Content-Type: multipart/form-data
```

**Request Body:**
```
recording: File (video/webm, video/mp4)
```

**Response Success:**
```json
{
  "success": true,
  "filename": "recording-1706972400000.webm",
  "url": "/recordings/recording-1706972400000.webm"
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "No file uploaded"
}
```

#### 4. List Recordings
```http
GET /api/recordings
```

**Response:**
```json
[
  "recording-1706972400000.webm",
  "recording-1706972500000.webm"
]
```

#### 5. Download/Stream Recording
```http
GET /recordings/:filename
```

**Example:**
```
GET /recordings/recording-1706972400000.webm
```

Response: Video file stream

## 🔌 Socket.IO Events

### Client → Server Events

#### join-room
Join ke meeting room.
```javascript
socket.emit('join-room', { 
  roomId: 'room-123', 
  userId: 'user-456',
  userName: 'John Doe'
});
```

#### leave-room
Keluar dari meeting room.
```javascript
socket.emit('leave-room', { 
  roomId: 'room-123', 
  userId: 'user-456' 
});
```

#### offer
Kirim WebRTC offer ke peer tertentu.
```javascript
socket.emit('offer', { 
  roomId: 'room-123',
  targetSocketId: 'socket-789',
  offer: sdpOffer
});
```

#### answer
Kirim WebRTC answer ke peer tertentu.
```javascript
socket.emit('answer', { 
  roomId: 'room-123',
  targetSocketId: 'socket-789',
  answer: sdpAnswer
});
```

#### ice-candidate
Kirim ICE candidate.
```javascript
socket.emit('ice-candidate', { 
  roomId: 'room-123',
  targetSocketId: 'socket-789',
  candidate: iceCandidate
});
```

#### send-message
Kirim chat message.
```javascript
socket.emit('send-message', { 
  roomId: 'room-123',
  message: 'Hello everyone!',
  userName: 'John Doe',
  timestamp: Date.now()
});
```

#### update-media-state
Update status audio/video.
```javascript
socket.emit('update-media-state', { 
  roomId: 'room-123',
  userId: 'user-456',
  audio: true,
  video: false
});
```

#### start-screen-share
Mulai screen sharing.
```javascript
socket.emit('start-screen-share', { 
  roomId: 'room-123',
  userId: 'user-456'
});
```

#### stop-screen-share
Stop screen sharing.
```javascript
socket.emit('stop-screen-share', { 
  roomId: 'room-123',
  userId: 'user-456'
});
```

### Server → Client Events

#### user-joined
Notifikasi user baru bergabung.
```javascript
socket.on('user-joined', ({ userId, userName, socketId }) => {
  console.log(`${userName} joined the room`);
});
```

#### user-left
Notifikasi user keluar.
```javascript
socket.on('user-left', ({ userId, socketId }) => {
  console.log(`User left the room`);
});
```

#### room-users
List semua users dalam room.
```javascript
socket.on('room-users', (users) => {
  // users: [{ userId, userName, socketId, audio, video }]
});
```

#### offer
Menerima offer dari peer.
```javascript
socket.on('offer', ({ fromSocketId, offer }) => {
  // Handle incoming offer
});
```

#### answer
Menerima answer dari peer.
```javascript
socket.on('answer', ({ fromSocketId, answer }) => {
  // Handle incoming answer
});
```

#### ice-candidate
Menerima ICE candidate.
```javascript
socket.on('ice-candidate', ({ fromSocketId, candidate }) => {
  // Add ICE candidate
});
```

#### receive-message
Menerima chat message.
```javascript
socket.on('receive-message', ({ userId, userName, message, timestamp }) => {
  // Display message
});
```

#### media-state-updated
Update status media user.
```javascript
socket.on('media-state-updated', ({ userId, audio, video }) => {
  // Update UI
});
```

#### screen-share-started
Notifikasi screen share dimulai.
```javascript
socket.on('screen-share-started', ({ userId }) => {
  // Show screen share
});
```

#### screen-share-stopped
Notifikasi screen share dihentikan.
```javascript
socket.on('screen-share-stopped', ({ userId }) => {
  // Hide screen share
});
```

## 📁 Project Structure

```
api/
├── handlers/                   # Handler modules
│   ├── roomManager.js         # Room state management
│   ├── socketHandlers.js      # Socket.IO event handlers
│   └── uploadHandler.js       # File upload handlers
│
├── recordings/                 # Uploaded recordings directory
│
├── index.js                   # Main server entry point
├── index-backup.js            # Backup/reference file
├── package.json               # Dependencies & scripts
├── ecosystem.config.cjs       # PM2 configuration
├── .env                       # Environment variables (git ignored)
├── .env.example              # Example environment file
├── .gitignore                # Git ignore rules
└── README.md                 # This file
```

### File Descriptions

#### `index.js`
Main server file yang mengatur:
- Express app initialization
- Socket.IO server setup
- CORS configuration
- Route definitions
- Server startup

#### `handlers/roomManager.js`
Mengelola state dan logika room:
- Create/join/leave room
- User management dalam room
- Room cleanup
- State tracking

#### `handlers/socketHandlers.js`
Socket.IO event handlers untuk:
- WebRTC signaling
- Chat messaging
- Media state updates
- Screen sharing

#### `handlers/uploadHandler.js`
File upload management:
- Multer configuration
- File validation
- Upload handling
- File listing

#### `ecosystem.config.cjs`
PM2 configuration untuk production deployment.

## 🌐 Deployment

### VPS/Dedicated Server

1. **Upload Code ke Server**:
```bash
# Gunakan Git
git clone <your-repo-url>
cd api

# Atau upload via FTP/SCP
```

2. **Install Dependencies**:
```bash
npm install --production
```

3. **Setup Environment**:
```bash
cp .env.example .env
nano .env  # Edit sesuai production settings
```

4. **Install PM2**:
```bash
npm install -g pm2
```

5. **Start Application**:
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # Follow instructions untuk auto-start
```

6. **Setup Nginx Reverse Proxy**:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

7. **Setup SSL with Let's Encrypt**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### Production Environment Variables

```env
PORT=3001
HOST=0.0.0.0
BASE_URL=https://api.yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
NODE_ENV=production
```

### Docker Deployment (Optional)

Create `Dockerfile`:
```dockerfile
FROM node:20.19.2-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]
```

Build and run:
```bash
docker build -t webrtc-api .
docker run -p 3001:3001 --env-file .env webrtc-api
```

## 🐛 Troubleshooting

### Port Already in Use

**Windows:**
```bash
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -ti:3001 | xargs kill -9
```

### CORS Error

1. Pastikan frontend URL ada di `ALLOWED_ORIGINS`
2. Cek format: comma-separated, no spaces
3. Include protocol (http:// atau https://)

Example:
```env
ALLOWED_ORIGINS=http://localhost:3000,https://app.yourdomain.com
```

### Socket.IO Connection Failed

1. Cek firewall settings
2. Pastikan port 3001 accessible
3. Verify WebSocket support di proxy/load balancer

### File Upload Error

1. Cek permissions folder `recordings/`:
```bash
chmod 755 recordings/
```

2. Cek disk space:
```bash
df -h
```

3. Verify Multer configuration di `handlers/uploadHandler.js`

### Memory Issues

Monitor dengan PM2:
```bash
pm2 monit
```

Increase memory limit:
```bash
pm2 start index.js --max-memory-restart 500M
```

### Check Logs

```bash
# PM2 logs
pm2 logs webrtc-api

# Node logs (jika tidak pakai PM2)
node index.js 2>&1 | tee server.log
```

## 📝 Testing

### Manual Testing dengan curl

**Health Check:**
```bash
curl http://localhost:3001/health
```

**List Recordings:**
```bash
curl http://localhost:3001/api/recordings
```

**Upload Recording:**
```bash
curl -X POST -F "recording=@test-video.webm" http://localhost:3001/api/upload-recording
```

### Socket.IO Testing

Gunakan Socket.IO client atau tools seperti:
- [Socket.IO Client Tool](https://amritb.github.io/socketio-client-tool/)
- Postman (support WebSocket)

## 📄 License

ISC License

## 🔗 Links

- [Express Documentation](https://expressjs.com/)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [WebRTC Documentation](https://webrtc.org/getting-started/overview)

---

**Need Help?** Create an issue atau hubungi developer.
