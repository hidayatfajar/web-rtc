/**
 * WebRTC Meeting Server - Clean & Modular Architecture
 * Author: Fajar Nur Hidayat
 */
import { Server } from "socket.io";
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { setupSocketHandlers } from "./handlers/socketHandlers.js";
import { upload, handleUpload, listRecordings } from "./handlers/uploadHandler.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// env configuration
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:3001"];

const app = express();
const server = http.createServer(app);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes("*")) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use("/recordings", express.static(path.join(__dirname, "recordings")));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS.includes("*") ? "*" : ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  setupSocketHandlers(io, socket);
});

app.get("/debug/rooms", (req, res) => {
  const rooms = {};
  for (const [name, set] of io.sockets.adapter.rooms) {
    if (io.sockets.sockets.get(name)) continue;
    rooms[name] = Array.from(set);
  }
  res.json(rooms);
});

app.post("/api/upload-recording", upload.single("recording"), handleUpload);

app.get("/api/recordings", listRecordings);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    type: "webrtc-api v1.0",
    author: "Fajar Nur Hidayat (Ganteng)",
  });
});

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    type: "webrtc-api v1.0",
    author: "Fajar Nur Hidayat (Ganteng)",
  });
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`📁 Base URL: ${BASE_URL}`);
  console.log(`🔗 Allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
});
