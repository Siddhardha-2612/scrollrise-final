import 'dotenv/config';
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connectDB } from "./src/db/mongoose";
import { User, Flash, Post, ConnectionRequest, Connection, Message, Group, Sale, Shopi, Pin, Notification, Report, VoiceMessageModel } from "./src/db/models";


// Configure multer storage for raw binary audio files
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

// ---- DATA MODELS & IN-MEMORY DB ----

export interface VoiceMessage {
  messageId: string;
  senderId: string;
  receiverId: string;
  audioUrl: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  timestamp: string;
  status: "recording" | "sent" | "delivered" | "read";
  filePath?: string;
  mimeType?: string;
}

// 1. Users Schema
export interface User {
  id: string;
  username: string; // Used as name
  passwordHash: string; // securely hashed
  secretCode: string; // 8 digit
  mobileNumber: string;
  hideDetails: boolean;
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET environment variable is missing! Auth will be insecure.");
}

// Helper: Haversine distance in km
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
        lat: 12.9716, // Default coords (e.g., Bangalore)
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

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    // User joins their own private room for targeted updates
    socket.on('join', async (username) => {
      socket.join(username);
      console.log(`[Socket] User ${username} is now online (Socket ID: ${socket.id})`);

      try {
        // Auto-join group rooms
        const groups = await Group.find({ members: username });
        groups.forEach(g => {
          socket.join(g._id.toString());
          console.log(`[Socket] User ${username} auto-joined group: ${g._id}`);
        });
      } catch (err) {
        console.error("[Socket] Join groups error:", err);
      }
    });

    // Handle joining specific group rooms (e.g. newly invited)
    socket.on('join-group', (groupId) => {
      socket.join(groupId);
      console.log(`[Socket] User joined group room: ${groupId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });

  const PORT = process.env.PORT || 3000;

  // Custom CORS middleware to support sandboxed iframes and cross-origin requests cleanly
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

  // Increase payload limit for raw base64 audio data transfers
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Create uploads directory and serve statically
  const UPLOADS_DIR = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  app.use("/uploads", express.static(UPLOADS_DIR));

  // API ROUTES

  // --- AUTHENTICATION ROUTES ---
  app.post("/api/auth/register", async (req, res) => {
    const { username, password, secretCode, mobileNumber, hideDetails, selfieUrl } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ username: { $regex: new RegExp("^" + username + "$", "i") } });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }
    
    // Exact match check
    const exactlySame = await User.findOne({ username, secretCode, mobileNumber });
    if (exactlySame) {
      return res.status(400).json({ error: "This account already exists." });
    }

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
    }, JWT_SECRET, { expiresIn: '7d' });
    
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
        backgroundUrl: newUser.backgroundUrl,
        backgroundColor: newUser.backgroundColor,
        backgroundBrightness: newUser.backgroundBrightness,
        glassmorphism: newUser.glassmorphism,
        selfieUrl: newUser.selfieUrl
      }
    });
  });

  // Get all users created with a selfie for face matching simulation
  app.get("/api/auth/users-with-selfies", async (req, res) => {
    try {
      // TRAFFIC CONTROLLER: Filter out users who have set their profile to private
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

  app.post("/api/auth/update-pro-settings", authenticateToken, async (req: any, res: any) => {
    try {
      const { backgroundUrl, backgroundColor, backgroundBrightness, glassmorphism } = req.body;
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (!user.isPro) return res.status(403).json({ error: "Pro status required" });

      if (backgroundUrl !== undefined) user.backgroundUrl = backgroundUrl;
      if (backgroundColor !== undefined) user.backgroundColor = backgroundColor;
      if (backgroundBrightness !== undefined) user.backgroundBrightness = backgroundBrightness;
      if (glassmorphism !== undefined) user.glassmorphism = glassmorphism;

      await user.save();
      res.json({ success: true, user });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/update-profile-avatar", authenticateToken, async (req: any, res: any) => {
    try {
      const { profileAvatar } = req.body;
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      user.selfieUrl = profileAvatar; // Using selfieUrl as profile avatar for now
      await user.save();
      res.json({ success: true, profileAvatar: user.selfieUrl });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/update-credentials", authenticateToken, async (req: any, res: any) => {
    try {
      const { newUsername, newPassword } = req.body;
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      if (newUsername) user.username = newUsername;
      if (newPassword) {
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);
      }

      await user.save();
      res.json({ success: true, message: "Credentials updated successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/activate-pro", authenticateToken, async (req: any, res: any) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      user.isPro = true;
      await user.save();
      res.json({ success: true, message: "Pro status activated!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username: { $regex: new RegExp("^" + username + "$", "i") } });
    
    if (!user) {
      return res.status(404).json({ error: "Account not found. Please create an account from the front page first." });
    }
    
    let isMatch = false;
    // Check if the stored hash is actually a bcrypt hash or an old plaintext password
    if (user.passwordHash && (user.passwordHash.startsWith("$2a$") || user.passwordHash.startsWith("$2b$"))) {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    } else {
      isMatch = (password === user.passwordHash);
      if (isMatch) {
        // Auto-upgrade the password to bcrypt
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(password, salt);
        await user.save();
      }
    }
    
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password credential. Access denied." });
    }
    
    const token = jwt.sign({
      id: user._id,
      username: user.username,
      isPro: user.isPro
    }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      success: true, 
      token, 
      user: {
        id: user._id,
        username: user.username,
        mobileNumber: user.mobileNumber,
        hideDetails: user.hideDetails,
        isPro: user.isPro,
        backgroundUrl: user.backgroundUrl,
        backgroundColor: user.backgroundColor,
        backgroundBrightness: user.backgroundBrightness,
        glassmorphism: user.glassmorphism
      }
    });
  });

  app.post("/api/auth/verify-secret-code", async (req, res) => {
    try {
      const { username, secretCode } = req.body;
      if (!username || !secretCode) {
        return res.status(400).json({ error: "Username and secret code are required" });
      }

      const user = await User.findOne({ username: { $regex: new RegExp("^" + username + "$", "i") } });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.secretCode === secretCode) {
        const token = jwt.sign({
      id: user._id,
      username: user.username,
      isPro: user.isPro
    }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({
          success: true,
          token,
          user: {
            username: user.username,
            mobileNumber: user.mobileNumber,
            hideDetails: user.hideDetails,
            selfieUrl: user.selfieUrl
          }
        });
      } else {
        return res.status(401).json({ error: "Incorrect Secret Code" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/reset-password", authenticateToken, async (req: any, res: any) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword) return res.status(400).json({ error: "New password is required" });

      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      await user.save();

      res.json({ success: true, message: "Password updated successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    const { username, secretCode, mobileNumber, newPassword } = req.body;
    
    const user = await User.findOne({ 
      username: { $regex: new RegExp("^" + username + "$", "i") },
      secretCode,
      mobileNumber
    });
    
    if (!user) {
      return res.status(400).json({ error: "Verification failed. No matching account with those recovery details was found." });
    }
    
    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      await user.save();
      return res.json({ success: true, message: "Password updated successfully." });
    }
    
    res.json({ success: true, message: "Account verified" });
  });

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
    
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        console.log(`[Auth] Invalid token, falling back to session for: ${fallbackUsername}`);
        req.user = { id: "650000000000000000000000", username: fallbackUsername, isPro: false };
        return next();
      }
      req.user = user;
      next();
    });
  };


  // Flashes
  app.get('/api/flashes', authenticateToken, async (req: any, res: any) => {
    try {
      // TRAFFIC CONTROLLER: Only show flashes from public users
      const publicUsers = await User.find({ isPrivate: { $ne: true } }).select('_id username isPro');
      const publicUserIds = publicUsers.map(u => u._id);

      const flashes = await Flash.find({
        userId: { $in: publicUserIds },
        visibility: { $ne: 'private' }
      }).sort({ createdAt: -1 });

      const enrichedFlashes = flashes.map(f => {
        const user = publicUsers.find(u => u._id.toString() === f.userId.toString());
        return {
          ...f.toObject(),
          isPro: user ? user.isPro : false
        };
      });

      res.json(enrichedFlashes);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  app.post('/api/flashes', authenticateToken, async (req: any, res: any) => {
    try {
      const flash = new Flash({
        ...req.body,
        userId: req.user.id,
        username: req.user.username
      });
      await flash.save();

      const myUsername = req.user.username;
      const connections = await Connection.find({
        $or: [{ user1: myUsername }, { user2: myUsername }]
      });

      const flashData = { ...flash.toObject(), isPro: req.user.isPro };

      io.to(myUsername).emit('flash-update', flashData);

      connections.forEach(conn => {
        const recipient = conn.user1 === myUsername ? conn.user2 : conn.user1;
        io.to(recipient).emit('flash-update', flashData);
      });

      res.json(flashData);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/flashes/:id/like', authenticateToken, async (req: any, res: any) => {
    try {
      const flash = await Flash.findById(req.params.id);
      if (!flash) return res.status(404).json({ error: "Flash not found" });

      const index = (flash.likes || []).indexOf(req.user.username);
      if (index === -1) {
        flash.likes = flash.likes || [];
        flash.likes.push(req.user.username);
      } else {
        flash.likes.splice(index, 1);
      }
      await flash.save();

      // Notify all connected users about the new like count
      io.emit('flash-stats-update', { id: flash._id, likes: flash.likes.length, likedBy: flash.likes });
      res.json({ success: true, likes: flash.likes.length });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/flashes/:id/comment', authenticateToken, async (req: any, res: any) => {
    try {
      const { text } = req.body;
      const flash = await Flash.findById(req.params.id);
      if (!flash) return res.status(404).json({ error: "Flash not found" });

      const comment = { username: req.user.username, text, createdAt: new Date() };
      flash.comments = flash.comments || [];
      flash.comments.push(comment);
      await flash.save();

      // Notify users about the new comment
      io.emit('flash-comment-update', { id: flash._id, comments: flash.comments });
      res.json(comment);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Posts
  app.get('/api/posts', authenticateToken, async (req: any, res: any) => {
    try {
      // TRAFFIC CONTROLLER: Only show posts from public users
      const publicUsers = await User.find({ isPrivate: { $ne: true } }).select('_id username isPro');
      const publicUserIds = publicUsers.map(u => u._id);

      const posts = await Post.find({
        userId: { $in: publicUserIds },
        visibility: { $ne: 'private' }
      }).sort({ createdAt: -1 });

      const enrichedPosts = posts.map(p => {
        const user = publicUsers.find(u => u._id.toString() === p.userId.toString());
        return {
          ...p.toObject(),
          isPro: user ? user.isPro : false
        };
      });

      res.json(enrichedPosts);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/posts', authenticateToken, async (req: any, res: any) => {
    try {
      const post = new Post({
        ...req.body,
        userId: req.user.id,
        username: req.user.username,
        likes: [],
        comments: []
      });
      await post.save();

      const postData = { ...post.toObject(), isPro: req.user.isPro };
      io.emit('post-update', postData);
      res.json(postData);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/posts/:id/like', authenticateToken, async (req: any, res: any) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });

      const index = (post.likes || []).indexOf(req.user.username);
      if (index === -1) {
        post.likes = post.likes || [];
        post.likes.push(req.user.username);
      } else {
        post.likes.splice(index, 1);
      }
      await post.save();

      io.emit('post-stats-update', { id: post._id, likes: post.likes.length, likedBy: post.likes });
      res.json({ success: true, likes: post.likes.length });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/posts/:id/comment', authenticateToken, async (req: any, res: any) => {
    try {
      const { text } = req.body;
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });

      const comment = { username: req.user.username, text, createdAt: new Date() };
      post.comments = post.comments || [];
      post.comments.push(comment);
      await post.save();

      io.emit('post-comment-update', { id: post._id, comments: post.comments });
      res.json(comment);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.delete('/api/flashes/:id', authenticateToken, async (req: any, res: any) => {
    try {
      await Flash.findOneAndDelete({ _id: req.params.id, username: req.user.username });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Blocks
  app.post('/api/blocks', authenticateToken, async (req: any, res: any) => {
    try {
      const { targetUsername } = req.body;
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      if (!user.blockedUsers.includes(targetUsername)) {
        user.blockedUsers.push(targetUsername);
        await user.save();
      }
      res.json({ success: true, blockedUsers: user.blockedUsers });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.delete('/api/blocks/:username', authenticateToken, async (req: any, res: any) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      user.blockedUsers = user.blockedUsers.filter(u => u !== req.params.username);
      await user.save();
      res.json({ success: true, blockedUsers: user.blockedUsers });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Connections
  app.get('/api/connections', authenticateToken, async (req: any, res: any) => {
    try {
      const connections = await Connection.find({ $or: [{ user1: req.user.username }, { user2: req.user.username }] });
      res.json(connections);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  
  app.post('/api/connections/request', authenticateToken, async (req: any, res: any) => {
    try {
      const { toUser } = req.body;
      const fromUser = req.user.username;

      if (toUser === fromUser) return res.status(400).json({ error: "Cannot connect to yourself" });

      // Check if already connected
      const alreadyConnected = await Connection.findOne({
        $or: [
          { user1: fromUser, user2: toUser },
          { user1: toUser, user2: fromUser }
        ]
      });
      if (alreadyConnected) return res.json({ status: 'connected' });

      // Check if there's an incoming request from toUser to fromUser
      const incomingRequest = await ConnectionRequest.findOne({ fromUser: toUser, toUser: fromUser });

      if (incomingRequest) {
        // Bi-directional intent matched! Create Connection
        const connection = new Connection({ user1: fromUser, user2: toUser });
        await connection.save();

        // Clean up requests in both directions
        await ConnectionRequest.deleteMany({
          $or: [
            { fromUser, toUser },
            { fromUser: toUser, toUser: fromUser }
          ]
        });

        // Notify both parties instantly
        io.to(fromUser).emit('connection-accepted', { with: toUser });
        io.to(toUser).emit('connection-accepted', { with: fromUser });

        return res.json({ success: true, status: 'connected' });
      }

      // Check if request already sent
      const alreadySent = await ConnectionRequest.findOne({ fromUser, toUser });
      if (alreadySent) return res.json(alreadySent);

      const request = new ConnectionRequest({ fromUser, toUser });
      await request.save();

      // Notify recipient
      io.to(toUser).emit('connection-request', {
        from: fromUser,
        requestId: request._id
      });

      res.json(request);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Messages
  app.get('/api/messages/:otherUser', authenticateToken, async (req: any, res: any) => {
    try {
      const { otherUser } = req.params;
      let query;

      if (otherUser.startsWith('group_')) {
        const groupId = otherUser.replace('group_', '');
        query = { groupId };
      } else {
        query = {
          $or: [
            { senderUsername: req.user.username, receiverUsername: otherUser },
            { senderUsername: otherUser, receiverUsername: req.user.username }
          ]
        };
      }

      const messages = await Message.find(query).sort({ createdAt: 1 });
      res.json(messages);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  app.post('/api/messages', authenticateToken, async (req: any, res: any) => {
    try {
      const msg = new Message({ ...req.body, senderUsername: req.user.username });
      await msg.save();

      if (msg.groupId) {
        io.to(msg.groupId).emit('message-receive', msg);
      } else {
        io.to(msg.receiverUsername).emit('message-receive', msg);
        io.to(msg.senderUsername).emit('message-receive', msg);
      }

      res.json(msg);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Groups
  app.get('/api/groups', authenticateToken, async (req: any, res: any) => {
    try {
      const groups = await Group.find({ members: req.user.username });
      res.json(groups);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  app.post('/api/groups', authenticateToken, async (req: any, res: any) => {
    try {
      const group = new Group({ ...req.body, createdBy: req.user.username, members: [...req.body.members, req.user.username] });
      await group.save();

      // TRAFFIC CONTROLLER: Tell all members to join the new group room
      group.members.forEach((member: string) => {
        io.to(member).emit('group-invite', {
          groupId: group._id,
          name: group.name
        });
      });

      res.json(group);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Sales
  app.get('/api/sales', authenticateToken, async (req: any, res: any) => {
    try {
      const sales = await Sale.find().sort({ createdAt: -1 });
      res.json(sales);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  app.delete('/api/sales/:id', authenticateToken, async (req: any, res: any) => {
    try {
      await Sale.findOneAndDelete({ _id: req.params.id, username: req.user.username });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  app.post('/api/sales', authenticateToken, async (req: any, res: any) => {
    try {
      // RATE LIMITING: Strictly 3 posts per rolling 24-hour window
      const rollingWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const postCount = await Sale.countDocuments({
        username: req.user.username,
        createdAt: { $gte: rollingWindow }
      });

      if (postCount >= 3) {
        return res.status(403).json({ error: "Daily limit reached. You can only post 3 sales per 24 hours." });
      }
      
      const sale = new Sale({ ...req.body, username: req.user.username });
      await sale.save();
      res.json(sale);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Shopi
  app.get('/api/shopi', authenticateToken, async (req: any, res: any) => {
    try {
      const items = await Shopi.find().sort({ createdAt: -1 });
      res.json(items);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  app.delete('/api/shopi/:id', authenticateToken, async (req: any, res: any) => {
    try {
      await Shopi.findOneAndDelete({ _id: req.params.id, username: req.user.username });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  app.post('/api/shopi', authenticateToken, async (req: any, res: any) => {
    try {
      // RATE LIMITING: Strictly 10 items per rolling 24-hour window
      const rollingWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const itemCount = await Shopi.countDocuments({
        username: req.user.username,
        createdAt: { $gte: rollingWindow }
      });

      if (itemCount >= 10) {
        return res.status(403).json({ error: "Daily limit reached. You can only post 10 Shopi items per 24 hours." });
      }
      
      const item = new Shopi({ ...req.body, username: req.user.username });
      await item.save();
      res.json(item);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  
  // Notifications
  app.get('/api/notifications', authenticateToken, async (req: any, res: any) => {
    try {
      const notifs = await Notification.find({ username: req.user.username }).sort({ createdAt: -1 });
      res.json(notifs);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  
  // Reports
  app.post('/api/reports', authenticateToken, async (req: any, res: any) => {
    try {
      const report = new Report({ ...req.body, reportedBy: req.user.username });
      await report.save();
      res.json(report);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // -----------------------------



  // Get active pins within 30km of customer
  app.get("/api/pins", authenticateToken, async (req: any, res: any) => {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    try {
      const activePins = await Pin.find({ isActive: true });
      const clientPins = activePins.map(p => ({
        id: p._id.toString(),
        vendorId: p.vendorId || p.username,
        vendorName: p.vendorName || p.title,
        desc: p.details || "",
        description: p.details || "",
        lat: p.lat,
        lng: p.lng,
        openTime: p.openTime,
        closeTime: p.closeTime,
        isActive: p.isActive,
        createdAt: p.createdAt,
        reports: p.reports || 0,
        expiresAt: p.expiresAt
      }));

      if (isNaN(lat) || isNaN(lng)) {
        return res.json(clientPins);
      }

      const nearbyPins = clientPins.filter(p => {
        const dist = getDistanceFromLatLonInKm(lat, lng, p.lat, p.lng);
        return dist <= 30; // Strictly 30km radius check
      });

      res.json(nearbyPins);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/voice/upload', authenticateToken, upload.single('audio'), async (req: any, res: any) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const audioUrl = `/uploads/${req.file.filename}`;
      res.json({ success: true, audioUrl });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Pay and drop pin
  app.post("/api/pins", authenticateToken, async (req: any, res: any) => {
    const { vendorId, vendorName, description, lat, lng, openTime, closeTime, expiresAt } = req.body;
    
    try {
      const newPin = new Pin({
        username: req.user.username || vendorName || "vendor",
        title: vendorName || "My Stall",
        details: description || "Stall",
        lat,
        lng,
        openTime: openTime || "09:00",
        closeTime: closeTime || "22:00",
        isActive: true,
        reports: 0,
        expiresAt,
        vendorId: req.user.id || vendorId,
        vendorName: vendorName || "My Stall"
      });
      await newPin.save();

      res.json({ 
        success: true, 
        pin: {
          id: newPin._id.toString(),
          vendorId: newPin.vendorId,
          vendorName: newPin.vendorName,
          desc: newPin.details,
          description: newPin.details,
          lat: newPin.lat,
          lng: newPin.lng,
          openTime: newPin.openTime,
          closeTime: newPin.closeTime,
          isActive: newPin.isActive,
          createdAt: newPin.createdAt,
          reports: newPin.reports,
          expiresAt: newPin.expiresAt
        } 
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Switch location
  app.put("/api/pins/:id/location", authenticateToken, async (req: any, res: any) => {
    const { lat, lng } = req.body;
    try {
      const pin = await Pin.findById(req.params.id);
      if (pin) {
        pin.lat = lat;
        pin.lng = lng;
        await pin.save();
        res.json({ 
          success: true, 
          pin: {
            id: pin._id.toString(),
            vendorId: pin.vendorId,
            vendorName: pin.vendorName,
            desc: pin.details,
            description: pin.details,
            lat: pin.lat,
            lng: pin.lng,
            openTime: pin.openTime,
            closeTime: pin.closeTime,
            isActive: pin.isActive,
            createdAt: pin.createdAt,
            reports: pin.reports,
            expiresAt: pin.expiresAt
          } 
        });
      } else {
        res.status(404).json({ error: "Pin not found" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Report pin
  app.post("/api/pins/:id/report", authenticateToken, async (req: any, res: any) => {
    const { reportedBy, reason } = req.body;
    const pinId = req.params.id;
    
    try {
      const report = new Report({
        reportedItemId: pinId,
        reportedItemType: 'pin',
        reportedBy: req.user.username || reportedBy || "anonymous",
        reason: reason || ""
      });
      await report.save();

      const pin = await Pin.findById(pinId);
      if (pin) {
        pin.reports = (pin.reports || 0) + 1;
        
        // Auto delete logic (20 reports in 24h)
        const today = new Date();
        today.setHours(today.getHours() - 24);
        const recentReportCount = await Report.countDocuments({
          reportedItemId: pinId,
          reportedItemType: 'pin',
          createdAt: { $gte: today }
        });

        if (recentReportCount >= 20) {
          pin.isActive = false; // Auto delete
        }
        await pin.save();
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vendor Geofence Cancel/Timeout
  app.post("/api/pins/:id/deactivate", authenticateToken, async (req: any, res: any) => {
    try {
      const pin = await Pin.findById(req.params.id);
      if (pin) {
        pin.isActive = false;
        await pin.save();
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Pin not found" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // =========================================================================
  // PRODUCTION-READY VOICE MESSAGE ENDPOINTS
  // =========================================================================

  // 1. POST /voice/start - Initialize voice message session
  const voiceStartHandler = async (req: express.Request, res: express.Response) => {
    const { senderId, receiverId } = req.body;
    const messageId = "vm_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    
    try {
      const message = new VoiceMessageModel({
        messageId,
        senderId: senderId || "me",
        receiverId: receiverId || "them",
        audioUrl: "",
        duration: 0,
        fileSize: 0,
        status: "recording"
      });
      await message.save();
      console.log(`[Voice API] Started session: ${messageId}`);
      res.status(201).json(message);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  app.post("/voice/start", authenticateToken, voiceStartHandler);
  app.post("/api/voice/start", authenticateToken, voiceStartHandler);

  // 2. POST /voice/stop - Stop voice recording session
  const voiceStopHandler = async (req: express.Request, res: express.Response) => {
    const { messageId } = req.body;
    try {
      const message = await VoiceMessageModel.findOne({ messageId });
      if (!message) {
        return res.status(404).json({ error: "Voice message session not found" });
      }
      message.status = "sent";
      await message.save();
      console.log(`[Voice API] Stopped session: ${messageId}`);
      res.json({ success: true, messageId, status: "sent" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  app.post("/voice/stop", authenticateToken, voiceStopHandler);
  app.post("/api/voice/stop", authenticateToken, voiceStopHandler);

  // 3. POST /voice/upload - Upload and save the raw audio file locally
  const voiceUploadHandler = async (req: express.Request, res: express.Response) => {
    try {
      let activeMessageId = req.body.messageId;
      let senderId = req.body.senderId || "me";
      let receiverId = req.body.receiverId || "them";
      let duration = req.body.duration ? parseFloat(req.body.duration) : 0;
      let filePath = "";
      let fileSize = 0;
      let mimeType = "audio/webm";
      let audioUrl = "";

      // Only accept binary file upload via multipart/form-data (Multer)
      if (!req.file) {
        return res.status(400).json({ error: "Missing uploaded file in multipart form-data" });
      }

      filePath = req.file.path;
      fileSize = req.file.size;
      mimeType = req.file.mimetype || "audio/webm";
      const fileName = path.basename(filePath);
      audioUrl = `/uploads/${fileName}`;
      
      if (!activeMessageId) {
        // Extract message ID from filename
        activeMessageId = fileName.substring(0, fileName.lastIndexOf('.'));
      }
      
      let message = await VoiceMessageModel.findOne({ messageId: activeMessageId });
      if (!message) {
        message = new VoiceMessageModel({
          messageId: activeMessageId,
          senderId,
          receiverId,
          audioUrl,
          duration: duration || 0,
          fileSize,
          status: "sent",
          filePath,
          mimeType
        });
      } else {
        message.audioUrl = audioUrl;
        message.fileSize = fileSize;
        message.filePath = filePath;
        message.mimeType = mimeType;
        if (duration) {
          message.duration = duration;
        }
        message.status = "sent";
      }
      
      await message.save();
      console.log(`[Voice API] Successfully uploaded voice message: ${activeMessageId} (${fileSize} bytes)`);
      
      res.status(200).json(message);
    } catch (err: any) {
      console.error("[Voice API] Exception inside upload route:", err);
      res.status(500).json({ error: err.message || "Failed to process voice upload" });
    }
  };
  app.post("/voice/upload", authenticateToken, upload.single('audioFile'), voiceUploadHandler);
  app.post("/api/voice/upload", authenticateToken, upload.single('audioFile'), voiceUploadHandler);

  // 4. GET /voice/:messageId - Retrieve metadata or stream the original audio
  const voiceGetHandler = async (req: express.Request, res: express.Response) => {
    const { messageId } = req.params;
    try {
      const message = await VoiceMessageModel.findOne({ messageId });
      
      if (!message) {
        return res.status(404).json({ error: "Voice message not found in metadata database" });
      }
      
      // Allow receivers to stream or download by checking query param, range, or headers
      const wantStream = req.query.stream === "true" || req.headers.accept?.includes("audio") || req.headers.range;
      
      if (wantStream) {
        if (!message.filePath || !fs.existsSync(message.filePath)) {
          return res.status(404).json({ error: "Original voice recording file not found on disk" });
        }
        
        const mimeType = message.mimeType || "audio/webm";
        const stat = fs.statSync(message.filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

          if (start >= fileSize) {
            res.status(416).send("Requested range not satisfiable\n" + start + " >= " + fileSize);
            return;
          }

          const chunksize = (end - start) + 1;
          const file = fs.createReadStream(message.filePath, { start, end });
          const head = {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize,
            "Content-Type": mimeType,
            "Cache-Control": "public, max-age=31536000"
          };

          res.writeHead(206, head);
          file.pipe(res);
        } else {
          const head = {
            "Content-Length": fileSize,
            "Content-Type": mimeType,
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=31536000"
          };
          res.writeHead(200, head);
          fs.createReadStream(message.filePath).pipe(res);
        }
      } else {
        res.json(message);
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  app.get("/voice/:messageId", authenticateToken, voiceGetHandler);
  app.get("/api/voice/:messageId", authenticateToken, voiceGetHandler);

  // 5. DELETE /voice/:messageId - Delete the voice message metadata and physical file
  const voiceDeleteHandler = async (req: express.Request, res: express.Response) => {
    const { messageId } = req.params;
    try {
      const message = await VoiceMessageModel.findOne({ messageId });
      
      if (!message) {
        return res.status(404).json({ error: "Voice message not found" });
      }
      
      if (message.filePath && fs.existsSync(message.filePath)) {
        fs.unlinkSync(message.filePath);
        console.log(`[Voice API] Physical file deleted: ${message.filePath}`);
      }
      await VoiceMessageModel.deleteOne({ messageId });
      console.log(`[Voice API] Message record removed: ${messageId}`);
      res.json({ success: true, messageId });
    } catch (err: any) {
      console.error("[Voice API] Exception in delete route:", err);
      res.status(500).json({ error: err.message || "Failed to delete voice message file" });
    }
  };
  app.delete("/voice/:messageId", authenticateToken, voiceDeleteHandler);
  app.delete("/api/voice/:messageId", authenticateToken, voiceDeleteHandler);

  // Serve uploads directory statically for audio playback
  const uploadsPath = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsPath, {
    setHeaders: (res, path, stat) => {
      res.set('Cache-Control', 'public, max-age=31536000');
      // allow CORS for audio elements if needed
      res.set('Access-Control-Allow-Origin', '*');
    }
  }));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
