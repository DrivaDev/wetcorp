import mongoose from 'mongoose'

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  }
}

const _uri = process.env.MONGODB_URI
if (!_uri) throw new Error('MONGODB_URI environment variable is not set')
const MONGODB_URI: string = _uri

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
  try {
    global.mongooseCache.conn = await global.mongooseCache.promise
  } catch (err) {
    global.mongooseCache.promise = null
    throw err
  }
  return global.mongooseCache.conn
}
