import { type InferSchemaType, model, Schema } from 'mongoose';

// Define the schema
const userSchema = new Schema(
  {
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
    },
  },
  {
    timestamps: true,
  },
);

// Mongoose "InferSchemaType" automatically generates the TypeScript interface
// so we don't have to manually keep an interface in sync with the schema.
export type UserType = InferSchemaType<typeof userSchema>;

export const User = model('User', userSchema);
