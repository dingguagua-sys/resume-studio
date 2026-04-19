import mongoose from "mongoose";

let cached: typeof mongoose | null = null;

export async function connectDb(uri: string) {
  if (cached && mongoose.connection.readyState === 1) return cached;
  cached = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  return cached;
}
