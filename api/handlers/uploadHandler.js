import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("[MULTER] Setting destination for file...");
    const dir = path.join(__dirname, "..", "recordings");
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

    const roomId = match ? match[1] : "unknown";

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `recording_${roomId}_${timestamp}.webm`;

    console.log(`[MULTER] Extracted roomId from filename: ${roomId}`);
    console.log(`[MULTER] Generated filename: ${filename}`);
    cb(null, filename);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
});

export function handleUpload(req, res) {
  console.log("[UPLOAD] Upload endpoint called");
  console.log("[UPLOAD] Headers:", JSON.stringify(req.headers, null, 2));
  console.log("[UPLOAD] Body exists:", !!req.body);
  console.log("[UPLOAD] File exists:", !!req.file);

  if (!req.file) {
    console.error("[UPLOAD] No file received");
    return res.status(400).json({ error: "No file uploaded" });
  }

  console.log("[UPLOAD] File info:", {
    fieldname: req.file.fieldname,
    originalname: req.file.originalname,
    encoding: req.file.encoding,
    mimetype: req.file.mimetype,
    size: req.file.size,
    destination: req.file.destination,
    filename: req.file.filename,
    path: req.file.path,
  });

  const fileUrl = `${req.protocol}://${req.get("host")}/recordings/${req.file.filename}`;
  console.log(`[UPLOAD] File uploaded successfully: ${fileUrl}`);

  res.json({
    url: fileUrl,
    filename: req.file.filename,
    size: req.file.size,
  });
}

export function listRecordings(req, res) {
  const recordingsDir = path.join(__dirname, "..", "recordings");

  if (!fs.existsSync(recordingsDir)) {
    return res.json({ recordings: [] });
  }

  fs.readdir(recordingsDir, (err, files) => {
    if (err) {
      console.error("[RECORDINGS] Error reading directory:", err);
      return res.status(500).json({ error: "Failed to read recordings" });
    }

    const recordings = files
      .filter((f) => f.endsWith(".webm"))
      .map((file) => {
        const filePath = path.join(recordingsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          url: `/recordings/${file}`,
          size: stats.size,
          created: stats.birthtime,
        };
      });

    res.json({ recordings });
  });
}
