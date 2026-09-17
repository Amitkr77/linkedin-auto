import mongoose from 'mongoose';

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
    }).then((m) => m);
  }
  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
  return cached.conn;
}
