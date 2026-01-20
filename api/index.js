import { Server } from "socket.io";
import express from "express";
import http from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment configuration
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:3001'];

const app = express();
const server = http.createServer(app);

// CORS middleware for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Multer setup for file upload with detailed logging
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("[MULTER] Setting destination for file...");
    const dir = path.join(__dirname, "recordings");
    console.log(`[MULTER] Destination directory: ${dir}`);
    
    if (!fs.existsSync(dir)) {
      console.log("[MULTER] Directory doesn't exist, creating...");
      fs.mkdirSync(dir, { recursive: true });
      console.log("[MULTER] Directory created successfully");
    } else {
      console.log("[MULTER] Directory already exists");
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    console.log("[MULTER] Generating filename...");
    console.log(`[MULTER] Original filename: ${file.originalname}`);
    console.log(`[MULTER] Mimetype: ${file.mimetype}`);
    
    // Extract roomId from original filename (format: room-{roomId}-{timestamp}.webm)
    const match = file.originalname.match(/^room-(.+?)-\d{4}-/);
    const roomId = match ? match[1] : "unknown";
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `recording_${roomId}_${timestamp}.webm`;
    
    console.log(`[MULTER] Extracted roomId from filename: ${roomId}`);
    console.log(`[MULTER] Generated filename: ${filename}`);
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
});

// Serve recordings as static files
app.use("/recordings", express.static(path.join(__dirname, "recordings")));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS.includes('*') ? '*' : ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Track room states (who is sharing, who is recording)
const roomStates = {};

function getRoomState(roomId) {
  if (!roomStates[roomId]) {
    roomStates[roomId] = {
      whoIsSharing: null,
      whoIsRecording: null,
    };
  }
  return roomStates[roomId];
}

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("join-room", (roomId) => {
    const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
    console.log("rooms of socket:", Array.from(socket.rooms));
    if (roomSize >= 10) {
      socket.emit("room-full", roomId);
      return;
    }

    socket.join(roomId);
    socket.data.roomId = roomId;

    // Get all participants in the room (array of socket IDs)
    const participants = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    
    // Get current room state
    const roomState = getRoomState(roomId);

    // Notify the user that just joined with current room state
    socket.emit("joined-room", { 
      roomId, 
      socketId: socket.id,
      participants, // kirim list semua orang yang udah ada di room
      whoIsSharing: roomState.whoIsSharing, // kirim info siapa yang lagi share
      isRecording: !!roomState.whoIsRecording, // kirim info apakah lagi recording
      whoIsRecording: roomState.whoIsRecording, // kirim info siapa yang lagi record
    });

    // Notify other users in the room about new user
    socket.to(roomId).emit("user-connected", {
      socketId: socket.id,
      participants // kirim list updated ke semua orang
    });

    console.log(`socket ${socket.id} joined room ${roomId}. Participants:`, participants);
  });

  // WebRTC signaling relay
  socket.on("webrtc-offer", ({ roomId, offer, targetId }) => {
    if (targetId) {
      // Send to specific peer
      io.to(targetId).emit("webrtc-offer", { socketId: socket.id, offer });
    } else {
      // Broadcast to room (backward compatibility)
      socket.to(roomId).emit("webrtc-offer", { socketId: socket.id, offer });
    }
  });

  socket.on("webrtc-answer", ({ roomId, answer, targetId }) => {
    if (targetId) {
      // Send to specific peer
      io.to(targetId).emit("webrtc-answer", { socketId: socket.id, answer });
    } else {
      // Broadcast to room (backward compatibility)
      socket.to(roomId).emit("webrtc-answer", { socketId: socket.id, answer });
    }
  });

  socket.on("webrtc-ice-candidate", ({ roomId, candidate, targetId }) => {
    if (targetId) {
      // Send to specific peer
      io.to(targetId).emit("webrtc-ice-candidate", { socketId: socket.id, candidate });
    } else {
      // Broadcast to room (backward compatibility)
      socket.to(roomId).emit("webrtc-ice-candidate", { socketId: socket.id, candidate });
    }
  });

  // Optional chat
  socket.on("chat-message", ({ roomId, message }) => {
    io.to(roomId).emit("chat-message", { socketId: socket.id, message });
  });

  // Sharing notifications
  socket.on("sharing-started", ({ roomId }) => {
    const roomState = getRoomState(roomId);
    roomState.whoIsSharing = socket.id;
    socket.to(roomId).emit("sharing-started", { socketId: socket.id });
    console.log(`socket ${socket.id} started sharing in room ${roomId}`);
  });

  socket.on("stop-sharing", ({ roomId }) => {
    const roomState = getRoomState(roomId);
    if (roomState.whoIsSharing === socket.id) {
      roomState.whoIsSharing = null;
    }
    socket.to(roomId).emit("sharing-stopped", { socketId: socket.id });
    console.log(`socket ${socket.id} stopped sharing in room ${roomId}`);
  });

  // Camera & Mic status
  socket.on("camera-toggled", ({ roomId, enabled }) => {
    socket.to(roomId).emit("camera-toggled", { socketId: socket.id, enabled });
    console.log(`socket ${socket.id} camera ${enabled ? "enabled" : "disabled"}`);
  });

  socket.on("mic-toggled", ({ roomId, enabled }) => {
    socket.to(roomId).emit("mic-toggled", { socketId: socket.id, enabled });
    console.log(`socket ${socket.id} mic ${enabled ? "enabled" : "disabled"}`);
  });

  // Request media status from all participants
  socket.on("request-media-status", ({ roomId }) => {
    socket.to(roomId).emit("media-status-requested", { requesterId: socket.id });
  });

  // Send media status to specific requester
  socket.on("media-status", ({ roomId, targetId, cameraEnabled, micEnabled }) => {
    io.to(targetId).emit("participant-media-status", {
      socketId: socket.id,
      cameraEnabled,
      micEnabled,
    });
  });

  // Recording events
  socket.on("recording-started", ({ roomId }) => {
    const roomState = getRoomState(roomId);
    roomState.whoIsRecording = socket.id;
    socket.to(roomId).emit("recording-started", { socketId: socket.id });
    console.log(`socket ${socket.id} started recording in room ${roomId}`);
  });

  socket.on("recording-stopped", ({ roomId }) => {
    const roomState = getRoomState(roomId);
    if (roomState.whoIsRecording === socket.id) {
      roomState.whoIsRecording = null;
    }
    socket.to(roomId).emit("recording-stopped", { socketId: socket.id });
    console.log(`socket ${socket.id} stopped recording in room ${roomId}`);
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    if (roomId) {
      // Clean up room state
      const roomState = getRoomState(roomId);
      if (roomState.whoIsSharing === socket.id) {
        roomState.whoIsSharing = null;
        socket.to(roomId).emit("sharing-stopped", { socketId: socket.id });
      }
      if (roomState.whoIsRecording === socket.id) {
        roomState.whoIsRecording = null;
        socket.to(roomId).emit("recording-stopped", { socketId: socket.id });
      }
      
      // Get updated participant list after this user leaves
      const participants = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
      
      socket.to(roomId).emit("user-disconnected", { 
        socketId: socket.id,
        participants // kirim list updated ke yang masih di room
      });
      
      // Clean up empty rooms
      if (participants.length === 0) {
        delete roomStates[roomId];
        console.log(`Room ${roomId} is now empty, cleaned up state`);
      }
    }
    console.log("disconnected:", socket.id);
  });
});

app.get("/debug/rooms", (req, res) => {
  const rooms = {};
  for (const [name, set] of io.sockets.adapter.rooms) {
    // Filter: ignore auto rooms (socket.id)
    if (io.sockets.sockets.get(name)) continue;
    rooms[name] = Array.from(set);
  }
  res.json(rooms);
});

// Upload recording endpoint with detailed logging
app.post("/api/upload-recording", (req, res, next) => {
  console.log("\n[UPLOAD] ============ NEW UPLOAD REQUEST ============");
  console.log(`[UPLOAD] Method: ${req.method}`);
  console.log(`[UPLOAD] URL: ${req.url}`);
  console.log(`[UPLOAD] Headers:`, req.headers);
  console.log(`[UPLOAD] Content-Type: ${req.headers['content-type']}`);
  next();
}, upload.single("recording"), (req, res) => {
  console.log("[UPLOAD] Multer middleware completed");
  console.log(`[UPLOAD] req.file exists: ${!!req.file}`);
  console.log(`[UPLOAD] req.body:`, req.body);
  
  try {
    if (!req.file) {
      console.log("[ERROR] No file in request!");
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(`[UPLOAD] File received:`);
    console.log(`[UPLOAD]   - Original name: ${req.file.originalname}`);
    console.log(`[UPLOAD]   - Saved as: ${req.file.filename}`);
    console.log(`[UPLOAD]   - Size: ${req.file.size} bytes (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`[UPLOAD]   - Path: ${req.file.path}`);
    console.log(`[UPLOAD]   - Mimetype: ${req.file.mimetype}`);

    const fileUrl = `${BASE_URL}/recordings/${req.file.filename}`;
    
    console.log(`[SUCCESS] ✅ Recording saved successfully!`);
    console.log(`[SUCCESS] URL: ${fileUrl}`);
    console.log(`[SUCCESS] Room ID: ${req.body.roomId}`);
    console.log("[UPLOAD] ============================================\n");
    const sizeFormatted = req.file.size > 1024 * 1024
      ? `${(req.file.size / 1024 / 1024).toFixed(2)} MB`
      : `${(req.file.size / 1024).toFixed(2)} KB`;
    console.log(`[UPLOAD] File size: ${sizeFormatted}`);

    res.json({
      success: true,
      filename: req.file.filename,
      url: fileUrl,
      size: req.file.size,
      size_formatted: sizeFormatted,
      roomId: req.body.roomId,
      timestamp: req.body.timestamp,
    });
  } catch (error) {
    console.error("[ERROR] ❌ Upload error:", error);
    console.error("[ERROR] Stack:", error.stack);
    console.log("[UPLOAD] ============================================\n");
    res.status(500).json({ error: "Upload failed", details: error.message });
  }
});

// List all recordings
app.get("/api/recordings", (req, res) => {
  try {
    const recordingsDir = path.join(__dirname, "recordings");
    
    if (!fs.existsSync(recordingsDir)) {
      return res.json({ recordings: [] });
    }

    const files = fs.readdirSync(recordingsDir);
    const recordings = files
      .filter((file) => file.endsWith(".webm"))
      .map((file) => {
        const stats = fs.statSync(path.join(recordingsDir, file));
        return {
          filename: file,
          url: `${BASE_URL}/recordings/${file}`,
          size: stats.size,
          size_formatted: stats.size > 1024 * 1024
            ? `${(stats.size / 1024 / 1024).toFixed(2)} MB`
            : `${(stats.size / 1024).toFixed(2)} KB`,
          created: stats.birthtime,
        };
      })
      .sort((a, b) => b.created - a.created);

    res.json({ recordings });
  } catch (error) {
    console.error("List recordings error:", error);
    res.status(500).json({ error: "Failed to list recordings" });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`📁 Base URL: ${BASE_URL}`);
  console.log(`🔗 Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
