export type AppRoute =
  | 'splash'
  | 'auth-gateway'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'dm-thread'
  | 'settings-detail'
  | 'blocked-users'
  | 'edit-profile-pic'
  | 'verify-phone'
  | 'edit-credentials'
  | 'ad-plus'
  | 'stars-graph'
  | 'privacy-panel'
  | 'category-swiper'
  | 'shopi-market'
  | 'sales-market'
  | 'tunes-hq'
  | 'connections-hub'
  | 'create-post'
  | 'notifications'
  | 'sales-add-details'
  | 'reels'
  | 'digital-qr-profile'
  | 'face-login';

export interface Message {
  id: string;
  sender: 'me' | 'user';
  text: string;
  timestamp: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'media';
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  createdAt?: number;
  autoPlay?: boolean;
  isPending?: boolean;
  fileSize?: number;
  duration?: number;
  status?: string;
}

export interface User {
  username: string;
  avatarUrl: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  storeName?: string;
  discount?: string;
  location?: string;
  contact?: string;
  publisherName?: string;
  isUserPosted?: boolean;
  publisherUid?: string;
  reportCount?: number;
  reportedByUsers?: string[];
  reportedByUids?: string[];
  currency?: string;
  sellerSelfie?: string;
}

export interface BlockedUser {
  id: string;
  username: string;
}

// Local Vendor Tracking Models
export interface AppUser {
  id: string;
  name: string;
  email: string;
  type: "Customer" | "Vendor";
}

export interface Pin {
  id: string;
  vendorId: string;
  vendorName: string;
  description: string;
  lat: number;
  lng: number;
  openTime: string;
  closeTime: string;
  isActive: boolean;
  reports: number;
}
