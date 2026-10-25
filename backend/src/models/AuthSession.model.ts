import { model, Schema } from 'mongoose';

const schema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true, select: false },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true },
);

export const AuthSession = model('AuthSession', schema);
