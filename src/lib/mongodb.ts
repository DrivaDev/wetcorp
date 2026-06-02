import mongoose from 'mongoose'

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  }
}

const MONGODB_URI = process.env.MONGODB_URI!

if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null }
}

export async function connectDB() {
  if (global.mongooseCache.conn) return global.mongooseCache.conn
  if (!global.mongooseCache.promise) {
    global.mongooseCache.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
      bufferCommands: false,
    })
  }
  global.mongooseCache.conn = await global.mongooseCache.promise
  return global.mongooseCache.conn
}
