import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "";

  if (!uri) {
    console.error("MONGODB_URI environment variable is missing!");
    return;
  }

  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};
