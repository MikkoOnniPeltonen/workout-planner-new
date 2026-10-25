import { type InferSchemaType, model, Schema } from 'mongoose';

const userSchema = new Schema(
  {
    expiresAt: { type: Date, expires: 0 },
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      // Never returned by queries unless explicitly requested with .select('+password').
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

export type UserType = InferSchemaType<typeof userSchema>;

export const User = model('User', userSchema);
