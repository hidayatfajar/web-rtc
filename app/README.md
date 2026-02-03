# WebRTC Meeting Frontend Application

Frontend aplikasi video conference real-time menggunakan Nuxt 3, Vue 3, dan Socket.IO Client. Aplikasi ini menyediakan interface untuk video meeting dengan fitur chat, screen sharing, dan participant management.

## 📋 Daftar Isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Prasyarat](#prasyarat)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Project Structure](#project-structure)
- [Components](#components)
- [Composables](#composables)
- [State Management](#state-management)
- [Pages](#pages)
- [Build & Deployment](#build--deployment)
- [Troubleshooting](#troubleshooting)

## ✨ Fitur

- **Real-time Video Conference**: Video call dengan multiple participants
- **Audio/Video Controls**: Toggle camera dan microphone
- **Screen Sharing**: Berbagi layar dengan peserta lain
- **Live Chat**: Chat real-time dalam meeting
- **Participant List**: Lihat dan kelola peserta meeting
- **Responsive Layout**: Grid layout otomatis berdasarkan jumlah peserta
- **Meeting Rooms**: Join room menggunakan unique ID
- **User Authentication**: Login sebelum join meeting
- **Modern UI**: Menggunakan Nuxt UI components
- **Dark/Light Mode**: Theme switching

## 🛠 Teknologi

- **Runtime**: Node.js v20.19.2
- **Framework**: Nuxt 3 v3.20.2
- **UI Library**: Vue 3 v3.5.26
- **UI Components**: Nuxt UI v3.3.7
- **State Management**: Pinia v3.0.4
- **Socket Communication**: Socket.IO Client v4.8.3
- **Socket Integration**: nuxt-socket-io v3.0.13
- **Router**: Vue Router v4.6.4
- **Styling**: Tailwind CSS (via Nuxt UI)

## 📦 Prasyarat

- Node.js v20.19.2 atau lebih tinggi
- npm atau yarn
- Backend API harus berjalan (lihat dokumentasi `api/README.md`)

Verifikasi instalasi:
```bash
node -v
# Output: v20.19.2

npm -v
# Output: 10.x.x atau lebih tinggi
```

## 💻 Instalasi

### 1. Masuk ke Direktori App

```bash
cd app
```

### 2. Install Dependencies

```bash
npm install
```

Dependencies yang akan terinstall:
- `nuxt`: ^3.20.2 - Framework utama
- `vue`: ^3.5.26 - Vue framework
- `@nuxt/ui`: ^3.3.7 - UI component library
- `@pinia/nuxt`: ^0.11.3 - State management
- `pinia`: ^3.0.4 - Pinia core
- `socket.io-client`: ^4.8.3 - Socket.IO client
- `nuxt-socket-io`: ^3.0.13 - Nuxt Socket.IO integration
- `vue-router`: ^4.6.4 - Routing

### 3. Install Development Tools

Development dependencies sudah included:
```bash
npm run postinstall
```

Ini akan menjalankan `nuxt prepare` untuk generate types.

## ⚙️ Konfigurasi

### Environment Variables

1. Copy file `.env.example`:
```bash
cp .env.example .env
```

2. Edit file `.env`:

```env
# Socket.IO Server URL
# Development
NUXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Production example:
# NUXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com

# WebRTC ICE Servers Configuration
# STUN Servers (comma-separated)
NUXT_PUBLIC_STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302

# TURN Server (optional, recommended for production)
NUXT_PUBLIC_TURN_URL=turn:turn.yourdomain.com:3478
NUXT_PUBLIC_TURN_USERNAME=your_turn_username
NUXT_PUBLIC_TURN_CREDENTIAL=your_turn_password

# Node Environment
NODE_ENV=development

# Server Configuration
PORT=3000
HOST=0.0.0.0
```

### Penjelasan Environment Variables

| Variable | Deskripsi | Default | Required |
|----------|-----------|---------|----------|
| `NUXT_PUBLIC_SOCKET_URL` | URL backend Socket.IO server | http://localhost:3001 | Yes |
| `NUXT_PUBLIC_STUN_SERVERS` | STUN servers (comma-separated) | Google STUN servers | No |
| `NUXT_PUBLIC_TURN_URL` | TURN server URL (without transport) | - | No |
| `NUXT_PUBLIC_TURN_USERNAME` | TURN server username | - | No* |
| `NUXT_PUBLIC_TURN_CREDENTIAL` | TURN server password/credential | - | No* |
| `NODE_ENV` | Environment mode | development | No |
| `PORT` | Port aplikasi akan berjalan | 3000 | No |
| `HOST` | Host binding address | 0.0.0.0 | No |

**Note:** TURN server variables (URL, username, credential) harus diisi semua atau tidak sama sekali. Jika tidak diisi, aplikasi akan menggunakan STUN servers saja.

### Nuxt Configuration

File `nuxt.config.ts` sudah dikonfigurasi dengan:

```typescript
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: process.env.NODE_ENV !== "production" },
  
  modules: [
    "nuxt-socket-io",    // Socket.IO integration
    "@nuxt/ui",          // UI components
    "@pinia/nuxt"        // State management
  ],
  
  css: ["~/assets/css/main.css"],
  
  runtimeConfig: {
    public: {
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
      stunServers: process.env.NUXT_PUBLIC_STUN_SERVERS || "stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302",
      turnUrl: process.env.NUXT_PUBLIC_TURN_URL || "",
      turnUsername: process.env.NUXT_PUBLIC_TURN_USERNAME || "",
      turnCredential: process.env.NUXT_PUBLIC_TURN_CREDENTIAL || ""
    }
  },
  
  colorMode: {
    preference: "light",
    fallback: "light"
  },
  
  io: {
    sockets: [{
      name: "main",
      url: process.env.NUXT_PUBLIC_SOCKET_URL || "http://localhost:3001"
    }]
  }
});
```

### WebRTC ICE Servers Configuration

Aplikasi mendukung konfigurasi custom ICE servers untuk WebRTC connections:

#### STUN Servers
STUN (Session Traversal Utilities for NAT) servers digunakan untuk mendapatkan public IP address. By default menggunakan Google STUN servers.

**Format:** Comma-separated list
```env
NUXT_PUBLIC_STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
```

#### TURN Servers
TURN (Traversal Using Relays around NAT) servers digunakan sebagai relay ketika direct peer-to-peer connection gagal (misalnya karena firewall atau symmetric NAT).

**Kapan perlu TURN:**
- Production environment dengan users di belakang corporate firewall
- Symmetric NAT scenarios
- Meningkatkan success rate koneksi WebRTC

**Setup:**
```env
NUXT_PUBLIC_TURN_URL=turn:turn.yourdomain.com:3478
NUXT_PUBLIC_TURN_USERNAME=your_username
NUXT_PUBLIC_TURN_CREDENTIAL=your_password
```

**Note:** Aplikasi akan otomatis membuat 2 TURN servers (UDP dan TCP) dari config di atas:
- `turn:turn.yourdomain.com:3478?transport=udp` (primary)
- `turn:turn.yourdomain.com:3478?transport=tcp` (fallback)

#### TURN Server Options

**Public TURN Servers:**
- [Twilio TURN](https://www.twilio.com/stun-turn)
- [Xirsys](https://xirsys.com/)
- [Metered TURN](https://www.metered.ca/tools/openrelay/)

**Self-hosted:**
Install coturn server di VPS Anda:
```bash
sudo apt-get install coturn
```

Configure `/etc/turnserver.conf`:
```conf
listening-port=3478
fingerprint
lt-cred-mech
user=webrtcuser:strongpassword123
realm=yourdomain.com
```

## 🚀 Menjalankan Aplikasi

### Development Mode

```bash
npm run dev
```

Aplikasi akan berjalan di: `http://localhost:3000`

Output:
```
Nuxt 3.20.2 with Nitro 2.x.x

  ➜ Local:    http://localhost:3000/
  ➜ Network:  use --host to expose

✔ Nuxt DevTools is enabled v2.x.x
```

### Build untuk Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Generate Static Site (SSG)

```bash
npm run generate
```

### Menggunakan PM2 (Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start dengan PM2
pm2 start ecosystem.config.cjs

# PM2 commands
pm2 list
pm2 logs fe
pm2 restart fe
pm2 stop fe
pm2 delete fe
```

## 📁 Project Structure

```
app/
├── .nuxt/                     # Auto-generated Nuxt files
│   ├── components.d.ts       # Component types
│   ├── imports.d.ts          # Auto-imports types
│   └── ...
│
├── assets/                    # Static assets
│   └── css/
│       └── main.css          # Global styles
│
├── components/               # Vue Components
│   ├── ui/                  # Nuxt UI components
│   └── views/               # Custom view components
│       ├── ChatPanel.vue           # Chat interface
│       ├── ParticipantGrid.vue     # Video grid layout
│       ├── ParticipantList.vue     # Sidebar participant list
│       ├── ParticipantThumbnails.vue  # Thumbnail view
│       └── ScreenShareViewer.vue   # Screen share display
│
├── composables/              # Composable functions
│   ├── useAppToast.ts       # Toast notifications
│   └── useWebRTC.ts         # WebRTC logic
│
├── pages/                    # Nuxt pages (routes)
│   ├── index.vue            # Home page
│   ├── login.vue            # Login page
│   ├── [id].vue             # Dynamic meeting room
│   ├── meeting.vue          # Meeting interface
│   └── meeting-clean.vue    # Clean meeting interface
│
├── stores/                   # Pinia stores
│   └── meeting.ts           # Meeting state management
│
├── public/                   # Public static files
│   └── robots.txt
│
├── server/                   # Server directory
│   └── tsconfig.json
│
├── app.vue                   # Root component
├── nuxt.config.ts           # Nuxt configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies & scripts
├── ecosystem.config.cjs     # PM2 configuration
├── .env                     # Environment variables (git ignored)
├── .env.example            # Example environment file
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## 🧩 Components

### View Components

#### `ChatPanel.vue`
Component untuk menampilkan dan mengirim chat messages.

**Features:**
- Display chat messages dengan timestamps
- Input field untuk mengirim pesan
- Auto-scroll ke pesan terbaru
- User identification (sender/receiver)

#### `ParticipantGrid.vue`
Grid layout untuk menampilkan video semua participants.

**Features:**
- Dynamic grid layout (1-9 participants)
- Video stream display
- Audio/video indicators
- Participant names
- Screen share detection

#### `ParticipantList.vue`
Sidebar list untuk menampilkan info participants.

**Features:**
- List semua participants
- Audio/video status icons
- Participant count
- Toggle visibility

#### `ParticipantThumbnails.vue`
Thumbnail view untuk participants saat screen sharing.

**Features:**
- Small video thumbnails
- Fixed position layout
- Scroll untuk banyak participants

#### `ScreenShareViewer.vue`
Display untuk screen sharing stream.

**Features:**
- Full screen share display
- Stop screen share button
- Aspect ratio maintain

## 🔧 Composables

### `useWebRTC.ts`

Main composable untuk WebRTC functionality.

**Exports:**
```typescript
{
  localStream,           // Ref<MediaStream | null>
  remoteStreams,        // Ref<Map<string, MediaStream>>
  screenStream,         // Ref<MediaStream | null>
  isAudioEnabled,       // Ref<boolean>
  isVideoEnabled,       // Ref<boolean>
  isScreenSharing,      // Ref<boolean>
  
  initializeMedia,      // () => Promise<void>
  toggleAudio,          // () => void
  toggleVideo,          // () => void
  startScreenShare,     // () => Promise<void>
  stopScreenShare,      // () => void
  createPeerConnection, // (socketId: string) => RTCPeerConnection
  cleanup               // () => void
}
```

**Usage Example:**
```vue
<script setup>
import { useWebRTC } from '~/composables/useWebRTC';

const {
  localStream,
  isAudioEnabled,
  isVideoEnabled,
  initializeMedia,
  toggleAudio,
  toggleVideo
} = useWebRTC();

onMounted(async () => {
  await initializeMedia();
});
</script>
```

### `useAppToast.ts`

Toast notification composable.

**Exports:**
```typescript
{
  showToast,      // (options: ToastOptions) => void
  showSuccess,    // (message: string) => void
  showError,      // (message: string) => void
  showWarning,    // (message: string) => void
  showInfo        // (message: string) => void
}
```

**Usage Example:**
```vue
<script setup>
import { useAppToast } from '~/composables/useAppToast';

const { showSuccess, showError } = useAppToast();

const handleJoin = () => {
  showSuccess('Berhasil bergabung ke room!');
};
</script>
```

## 🗄 State Management

### Meeting Store (`stores/meeting.ts`)

Pinia store untuk managing meeting state.

**State:**
```typescript
{
  roomId: string | null,
  userId: string | null,
  userName: string | null,
  participants: Participant[],
  messages: Message[],
  isConnected: boolean
}
```

**Actions:**
```typescript
{
  setRoomId(roomId: string): void
  setUserId(userId: string): void
  setUserName(userName: string): void
  addParticipant(participant: Participant): void
  removeParticipant(socketId: string): void
  addMessage(message: Message): void
  updateParticipantMedia(socketId: string, media: MediaState): void
  clearMeeting(): void
}
```

**Usage Example:**
```vue
<script setup>
import { useMeetingStore } from '~/stores/meeting';

const meetingStore = useMeetingStore();

const joinRoom = () => {
  meetingStore.setRoomId('room-123');
  meetingStore.setUserId('user-456');
  meetingStore.setUserName('John Doe');
};
</script>
```

## 📄 Pages

### `index.vue`
Landing page dengan form untuk create/join room.

**Features:**
- Create new room
- Join existing room dengan ID
- Input nama user

### `login.vue`
Login page untuk autentikasi user.

**Features:**
- Username input
- Login validation
- Redirect ke home

### `[id].vue`
Dynamic route untuk meeting room berdasarkan ID.

**Route:** `/room-123`

**Features:**
- Auto-join room dari URL
- Meeting interface
- Leave room functionality

### `meeting.vue`
Main meeting interface dengan semua fitur.

**Features:**
- Video grid
- Chat panel
- Participant list
- Controls (audio/video/screen)
- Leave meeting button

### `meeting-clean.vue`
Simplified meeting interface.

**Features:**
- Minimalist UI
- Core meeting functionality

## 🌐 Build & Deployment

### Build Production

```bash
npm run build
```

Output akan di folder `.output/`

### Deployment Options

#### 1. Vercel (Recommended)

**Via CLI:**
```bash
npm install -g vercel
vercel
```

**Via Git Integration:**
1. Push ke GitHub/GitLab
2. Connect repository di Vercel
3. Set root directory: `app`
4. Add environment variable:
   - `NUXT_PUBLIC_SOCKET_URL`: Your backend URL
5. Deploy

**vercel.json:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".output/public",
  "framework": "nuxtjs"
}
```

#### 2. Netlify

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = ".output/public"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Deploy:
```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### 3. VPS/Dedicated Server

**With PM2:**
```bash
# Build
npm run build

# Start with PM2
pm2 start ecosystem.config.cjs

# Setup Nginx reverse proxy
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**SSL with Let's Encrypt:**
```bash
sudo certbot --nginx -d yourdomain.com
```

#### 4. Docker

**Dockerfile:**
```dockerfile
FROM node:20.19.2-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
```

**Build & Run:**
```bash
docker build -t webrtc-app .
docker run -p 3000:3000 --env-file .env webrtc-app
```

### Static Site Generation (SSG)

```bash
npm run generate
```

Output di `.output/public/` - dapat di-host di Netlify, Vercel, atau static host lainnya.

## 🐛 Troubleshooting

### Build Errors

**Clear cache dan rebuild:**
```bash
rm -rf .nuxt node_modules package-lock.json
npm install
npm run build
```

### Socket Connection Issues

1. **Check backend is running:**
```bash
curl http://localhost:3001/health
```

2. **Verify SOCKET_URL:**
```env
NUXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

3. **CORS issues:**
Pastikan frontend URL ada di `ALLOWED_ORIGINS` backend.

### WebRTC Not Working

1. **HTTPS required in production:**
WebRTC requires HTTPS (except localhost).

2. **Camera/Mic permissions:**
Check browser permissions untuk media devices.

3. **Browser compatibility:**
Use modern browsers (Chrome, Firefox, Safari, Edge).

### Port Already in Use

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -ti:3000 | xargs kill -9
```

### TypeScript Errors

**Regenerate types:**
```bash
npm run postinstall
```

### Hot Reload Not Working

1. Restart dev server
2. Check file watcher limits (Linux):
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Create room berhasil
- [ ] Join room dengan ID berhasil
- [ ] Video local tampil
- [ ] Audio/Video toggle berfungsi
- [ ] Chat mengirim dan menerima pesan
- [ ] Multiple participants bisa join
- [ ] Screen sharing berfungsi
- [ ] Leave room cleanup properly
- [ ] Responsive di mobile

### Browser Testing

Test di browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari (Mac/iOS)
- Mobile browsers

## 📝 Scripts

```json
{
  "dev": "nuxt dev",              // Development server
  "build": "nuxt build",          // Build untuk production
  "generate": "nuxt generate",    // Generate static site
  "preview": "nuxt preview",      // Preview production build
  "postinstall": "nuxt prepare"   // Generate types
}
```

## 📄 License

ISC License

## 🔗 Useful Links

- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Vue 3 Documentation](https://vuejs.org/)
- [Nuxt UI Documentation](https://ui.nuxt.com/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- [WebRTC Documentation](https://webrtc.org/)

## 💡 Tips

1. **Development:**
   - Use Vue DevTools extension
   - Enable Nuxt DevTools
   - Check browser console untuk errors

2. **Performance:**
   - Lazy load components
   - Use video constraints wisely
   - Cleanup streams saat unmount

3. **Security:**
   - Always use HTTPS in production
   - Validate user inputs
   - Handle errors gracefully

---

**Happy Coding! 🚀** Need help? Create an issue atau hubungi developer.
