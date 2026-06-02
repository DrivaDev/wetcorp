import mongoose, { Schema } from 'mongoose'

const UserSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true },
    rol: {
      type: String,
      enum: ['importador', 'proveedor', 'despachante'],
      required: true,
    },
  },
  { timestamps: true }
)

export const User = mongoose.models.User ?? mongoose.model('User', UserSchema)
