import mongoose, { Schema, Document } from 'mongoose';

// User Model
const UserSchema = new Schema({
  username: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  secretCode: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  hideDetails: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false }, // Toggle for hiding the profile globally
  isPro: { type: Boolean, default: false },
  backgroundUrl: { type: String, default: "" },
  backgroundColor: { type: String, default: "" },
  backgroundBrightness: { type: Number, default: 1 },
  glassmorphism: { type: Boolean, default: false },
  hasSalesSub: { type: Boolean, default: false },
  selfieUrl: { type: String, default: "" },
  blockedUsers: [{ type: String }]
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);

// Flash Model
const FlashSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  username: { type: String, required: true },
  mediaUrl: { type: String, required: true }, // Base64 or URL
  caption: { type: String },
  likes: [{ type: String }], // Array of usernames who liked
  comments: [{
    username: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now, expires: 86400 } // 24 hours
}, { timestamps: true });

export const Flash = mongoose.model('Flash', FlashSchema);

// Post Model
const PostSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  username: { type: String, required: true },
  mediaUrl: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  caption: { type: String },
  likes: [{ type: String }], // Array of usernames
  comments: [{
    username: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

export const Post = mongoose.model('Post', PostSchema);

// Connection Request Model
const ConnectionRequestSchema = new Schema({
  fromUser: { type: String, required: true, index: true },
  toUser: { type: String, required: true, index: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}, { timestamps: true });

export const ConnectionRequest = mongoose.model('ConnectionRequest', ConnectionRequestSchema);

// Connection Model
const ConnectionSchema = new Schema({
  user1: { type: String, required: true, index: true },
  user2: { type: String, required: true, index: true }
}, { timestamps: true });

export const Connection = mongoose.model('Connection', ConnectionSchema);

// Message Model
const MessageSchema = new Schema({
  senderUsername: { type: String, required: true, index: true },
  receiverUsername: { type: String, index: true },
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', index: true },
  text: { type: String },
  mediaUrl: { type: String },
  isVoice: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const Message = mongoose.model('Message', MessageSchema);

// Group Model
const GroupSchema = new Schema({
  name: { type: String, required: true },
  members: [{ type: String }],
  createdBy: { type: String, required: true }
}, { timestamps: true });

export const Group = mongoose.model('Group', GroupSchema);

// Sale Model
const SaleSchema = new Schema({
  username: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number },
  mediaUrl: { type: String },
  createdAt: { type: Date, default: Date.now, expires: 172800 } // 48 hours
}, { timestamps: true });

export const Sale = mongoose.model('Sale', SaleSchema);

// Shopi Model
const ShopiSchema = new Schema({
  username: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number },
  mediaUrl: { type: String },
  createdAt: { type: Date, default: Date.now, expires: 172800 } // 48 hours
}, { timestamps: true });

export const Shopi = mongoose.model('Shopi', ShopiSchema);

// Pin Model
const PinSchema = new Schema({
  username: { type: String, required: true },
  title: { type: String, required: true },
  details: { type: String },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  openTime: { type: String, default: "09:00" },
  closeTime: { type: String, default: "22:00" },
  isActive: { type: Boolean, default: true },
  reports: { type: Number, default: 0 },
  expiresAt: { type: Number },
  vendorId: { type: String },
  vendorName: { type: String },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // disappear end of day roughly, handled in app logic or TTL
}, { timestamps: true });

export const Pin = mongoose.model('Pin', PinSchema);

// VoiceMessage Model
const VoiceMessageSchema = new Schema({
  messageId: { type: String, required: true, unique: true, index: true },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  audioUrl: { type: String, default: "" },
  duration: { type: Number, default: 0 },
  fileSize: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: "recording" },
  filePath: { type: String },
  mimeType: { type: String }
}, { timestamps: true });

export const VoiceMessageModel = mongoose.model('VoiceMessage', VoiceMessageSchema);

// Notification Model
const NotificationSchema = new Schema({
  username: { type: String, required: true, index: true },
  type: { type: String, required: true }, // 'connection_request', 'flash', 'message'
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const Notification = mongoose.model('Notification', NotificationSchema);

// Report Model
const ReportSchema = new Schema({
  reportedItemId: { type: String, required: true, index: true },
  reportedItemType: { type: String, required: true }, // 'flash', 'pin', 'sale', 'shopi'
  reportedBy: { type: String, required: true },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const Report = mongoose.model('Report', ReportSchema);
