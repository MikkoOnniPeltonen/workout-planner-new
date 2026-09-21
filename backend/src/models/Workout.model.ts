import { type InferSchemaType, model, Schema } from 'mongoose';

const workoutSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      maxlength: 60,
    },
    belongsTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    exercises: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Exercise',
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Workout names are unique per user (case-insensitively), not across all users.
workoutSchema.index(
  { belongsTo: 1, name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);

export type WorkoutType = InferSchemaType<typeof workoutSchema>;

export const Workout = model('Workout', workoutSchema);
