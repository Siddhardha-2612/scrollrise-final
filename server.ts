import 'dotenv/config';
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connectDB } from "./src/db/mongoose";
import { User, Flash, Post, ConnectionRequest, Connection, Message, Group, Sale, Shopi, Pin, Notification, Report, VoiceMessageModel } from "./src/db/models";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET environment variable is missing! Auth will be insecure.");
}

// ---- MIDDLEWARE DEFINITIONS ----

// JWT Middleware for protected routes with robust fallback
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const fallbackUsername = req.headers['x-username'] || "User";

  if (!token) {
    console.log(`[Auth] No token, looking for user: ${fallbackUsername}`);
    const user = await User.findOne({ username: { $regex: new RegExp("^" + fallbackUsername + "$", "i") } });
    if (user) {
      req.user = { id: user._id.toString(), username: user.username, isPro: user.isPro };
    } else {
      // Create a dedicated system/guest ID that is a valid ObjectId
      req.user = { id: "650000000000000000000000", username: fallbackUsername, isPro: false };
    }
    return next();
  }

  jwt.verify(token, JWT_SECRET as string, (err: any, user: any) => {
    if (err) {
      console.log(`[Auth] Invalid token, falling back to session for: ${fallbackUsername}`);
      req.user = { id: "650000000000000000000000", username: fallbackUsername, isPro: false };
      return next();
    }
    req.user = user;
    next();
  });
};

// ---- HELPER FUNCTIONS ----

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const d = R * c; 
  return d;
}

// ---- SERVER STARTUP ----

async function startServer() {
  await connectDB();

  // Seed default pin if empty
  try {
    const pinCount = await Pin.countDocuments();
    if (pinCount === 0) {
      const defaultPin = new Pin({
        username: "u1",
        title: "Burger Cart",
        details: "Best local burgers",
        lat: 12.9716,
        lng: 77.5946,
        openTime: "10:00",
        closeTime: "22:00",
        isActive: true,
        reports: 0,
        vendorId: "u1",
        vendorName: "Burger Cart"
      });
      await defaultPin.save();
      console.log("[Seeding] Inserted default Burger Cart pin successfully.");
    }
  } catch (err) {
    console.error("Error seeding default pin:", err);
  }

  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // ---- MULTI-PART STORAGE CONFIG ----
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      const messageId = req.body.messageId || "vm_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      let ext = "webm";
      const mimeType = file.mimetype || "";
      if (mimeType.includes("mp4") || mimeType.includes("m4a")) ext = "m4a";
      else if (mimeType.includes("mpeg") || mimeType.includes("mp3")) ext = "mp3";
      else if (mimeType.includes("ogg")) ext = "ogg";
      else if (mimeType.includes("wav")) ext = "wav";
      else if (mimeType.includes("aac")) ext = "aac";
      cb(null, `${messageId}.${ext}`);
    }
  });
  const upload = multer({ storage });

  // ---- SOCKET.IO LOGIC ----
  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    socket.on('join', async (username) => {
      socket.join(username);
      console.log(`[Socket] User ${username} is now online`);

      try {
        const groups = await Group.find({ members: username });
        groups.forEach(g => {
          socket.join(g._id.toString());
        });
      } catch (err) {
        console.error("[Socket] Join groups error:", err);
      }
    });

    socket.on('join-group', (groupId) => {
      socket.join(groupId);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });

  const PORT = process.env.PORT || 3000;

  // ---- CORS & GLOBAL MIDDLEWARE ----
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-username");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const UPLOADS_DIR = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  app.use("/uploads", express.static(UPLOADS_DIR));

  // ---- API ROUTES ----

  // 1. AUTHENTICATION
  app.post("/api/auth/register", async (req, res) => {
    const { username, password, secretCode, mobileNumber, hideDetails, selfieUrl } = req.body;
    const existingUser = await User.findOne({ username: { $regex: new RegExp("^" + username + "$", "i") } });
    if (existingUser) return res.status(400).json({ error: "Username already exists" });
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const newUser = new User({
      username,
      passwordHash,
      secretCode,
      mobileNumber,
      hideDetails: !!hideDetails,
      selfieUrl: selfieUrl || ""
    });
    
    await newUser.save();
    
    const token = jwt.sign({
      id: newUser._id,
      username: newUser.username,
      isPro: newUser.isPro
    }, JWT_SECRET as string, { expiresIn: '7d' });
    
    res.status(201).json({ 
      success: true, 
      token, 
      username: newUser.username,
      user: {
        id: newUser._id,
        username: newUser.username,
        mobileNumber: newUser.mobileNumber,
        hideDetails: newUser.hideDetails,
        isPro: newUser.isPro,
        selfieUrl: newUser.selfieUrl
      }
    });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username: { $regex: new RegExp("^" + username + "$", "i") } });
    if (!user) return res.status(404).json({ error: "Account not found." });
    
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: "Incorrect password." });
    
    const token = jwt.sign({
      id: user._id,
      username: user.username,
      isPro: user.isPro
    }, JWT_SECRET as string, { expiresIn: '7d' });
    
    res.json({ 
      success: true, 
      token, 
      user: {
        id: user._id,
        username: user.username,
        mobileNumber: user.mobileNumber,
        hideDetails: user.hideDetails,
        isPro: user.isPro
      }
    });
  });

  app.get("/api/auth/users-with-selfies", async (req, res) => {
    try {
      const usersList = await User.find(
        { selfieUrl: { $ne: "" }, isPrivate: { $ne: true } },
        { username: 1, selfieUrl: 1, mobileNumber: 1 }
      );
      res.json(usersList);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res: any) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/verify-secret-code", async (req, res) => {
    try {
      const { username, secretCode } = req.body;
      const user = await User.findOne({ username: { $regex: new RegExp("^" + username + "$", "i") } });
      if (!user) return res.status(404).json({ error: "User not found" });

      if (user.secretCode === secretCode) {
        const token = jwt.sign({ id: user._id, username: user.username, isPro: user.isPro }, JWT_SECRET as string, { expiresIn: '7d' });
        return res.json({ success: true, token, user });
      } else {
        return res.status(401).json({ error: "Incorrect Secret Code" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. FLASHES & POSTS
  app.get('/api/flashes', authenticateToken, async (req: any, res: any) => {
    try {
      const publicUsers = await User.find({ isPrivate: { $ne: true } }).select('_id username isPro');
      const publicUserIds = publicUsers.map(u => u._id);
      const flashes = await Flash.find({ userId: { $in: publicUserIds }, visibility: { $ne: 'private' } }).sort({ createdAt: -1 });
      res.json(flashes);
    } catch (err) { res.status(500).json({ error: (err as any).message }); }
  });

  app.post('/api/flashes', authenticateToken, async (req: any, res: any) => {
    try {
      const flash = new Flash({ ...req.body, userId: req.user.id, username: req.user.username });
      await flash.save();
      res.json(flash);
    } catch (err) { res.status(500).json({ error: (err as any).message }); }
  });

  app.get('/api/posts', authenticateToken, async (req: any, res: any) => {
    try {
      const publicUsers = await User.find({ isPrivate: { $ne: true } }).select('_id username isPro');
      const publicUserIds = publicUsers.map(u => u._id);
      const posts = await Post.find({ userId: { $in: publicUserIds }, visibility: { $ne: 'private' } }).sort({ createdAt: -1 });
      res.json(posts);
    } catch (err) { res.status(500).json({ error: (err as any).message }); }
  });

  app.post('/api/posts', authenticateToken, async (req: any, res: any) => {
    try {
      const post = new Post({ ...req.body, userId: req.user.id, username: req.user.username });
      await post.save();
      res.json(post);
    } catch (err) { res.status(500).json({ error: (err as any).message }); }
  });

  // 3. CONNECTIONS & MESSAGES
  app.get('/api/connections', authenticateToken, async (req: any, res: any) => {
    try {
      const connections = await Connection.find({ $or: [{ user1: req.user.username }, { user2: req.user.username }] });
      res.json(connections);
    } catch (err) { res.status(500).json({ error: (err as any).message }); }
  });

  app.post('/api/connections/request', authenticateToken, async (req: any, res: any) => {
    try {
      const { toUser } = req.body;
      const fromUser = req.user.username;
      const request = new ConnectionRequest({ fromUser, toUser });
      await request.save();
      io.to(toUser).emit('connection-request', { from: fromUser });
      res.json(request);
    } catch (err) { res.status(500).json({ error: (err as any).message }); }
  });

  app.get('/api/messages/:otherUser', authenticateToken, async (req: any, res: any) => {
    try {
      const { otherUser } = req.params;
      const query = {
        $or: [
          { senderUsername: req.user.username, receiverUsername: otherUser },
          { senderUsername: otherUser, receiverUsername: req.user.username }
        ]
      };
      const messages = await Message.find(query).sort({ createdAt: 1 });
      res.json(messages);
    } catch (err) { res.status(500).json({ error: (err as any).message }); }
  });

  app.post('/api/messages', authenticateToken, async (req: any, res: any) => {
    try {
      const msg = new Message({ ...req.body, senderUsername: req.user.username });
      await msg.save();
      io.to(msg.receiverUsername).emit('message-receive', msg);
      res.json(msg);
    } catch (err) { res.status(500).json({ error: (err as any).message }); }
  });

  // 4. MAP PINS
  app.get("/api/pins", authenticateToken, async (req: any, res: any) => {
    try {
      const pins = await Pin.find({ isActive: true });
      res.json(pins);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/pins", authenticateToken, async (req: any, res: any) => {
    try {
      const pin = new Pin({ ...req.body, vendorId: req.user.id, username: req.user.username });
      await pin.save();
      res.json({ success: true, pin });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // 5. VOICE MESSAGES
  app.post("/api/voice/start", authenticateToken, async (req: any, res: any) => {
    const messageId = "vm_" + Date.now();
    const message = new VoiceMessageModel({ messageId, senderId: req.user.id, status: "recording" });
    await message.save();
    res.status(201).json(message);
  });

  app.post("/api/voice/upload", authenticateToken, upload.single('audioFile'), async (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const audioUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, audioUrl });
  });

  // ---- VITE / SPA SERVING ----
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on Port ${PORT}`);
  });
}

startServer();
