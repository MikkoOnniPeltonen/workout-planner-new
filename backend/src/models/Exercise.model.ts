import { type InferSchemaType, model, Schema } from 'mongoose';

const exerciseSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required.'],
    },
    belongsTo: [
      {
        type: Schema.Types.ObjectId,
        ref: 'MuscleGroup',
      },
    ],
    // Equipment options: any one of them is enough to perform the exercise.
    usedWith: [
      {
        type: String,
      },
    ],
    // How sets are logged: repetitions (optionally weighted) or seconds held.
    metric: {
      type: String,
      enum: ['reps', 'time'],
      default: 'reps',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

exerciseSchema.index({ belongsTo: 1 });

export type ExerciseType = InferSchemaType<typeof exerciseSchema>;

export const Exercise = model('Exercise', exerciseSchema);
