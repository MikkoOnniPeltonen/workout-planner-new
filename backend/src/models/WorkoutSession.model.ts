import { type InferSchemaType, model, Schema } from 'mongoose';

const setSchema = new Schema(
  {
    reps: { type: Number, min: 0 },
    weightKg: { type: Number, min: 0 },
    durationSec: { type: Number, min: 0 },
    completed: { type: Boolean, default: true },
  },
  { _id: false },
);

const entrySchema = new Schema(
  {
    exercise: {
      type: Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true,
    },
    sets: { type: [setSchema], default: [] },
  },
  { _id: false },
);

const workoutSessionSchema = new Schema(
  {
    expiresAt: { type: Date, expires: 0 },
    clientRequestId: { type: String },
    requestHash: { type: String, select: false },
    belongsTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workout: {
      type: Schema.Types.ObjectId,
      ref: 'Workout',
      default: null,
    },
    // Snapshot of the workout name, so history survives the workout being renamed or deleted.
    workoutName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    performedAt: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      min: 1,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    entries: { type: [entrySchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, result) {
        delete result.requestHash;
        return result;
      },
    },
  },
);

workoutSessionSchema.index({ belongsTo: 1, performedAt: -1, _id: -1 });
workoutSessionSchema.index(
  { belongsTo: 1, clientRequestId: 1 },
  { unique: true, partialFilterExpression: { clientRequestId: { $type: 'string' } } },
);

export type WorkoutSessionType = InferSchemaType<typeof workoutSessionSchema>;

export const WorkoutSession = model('WorkoutSession', workoutSessionSchema);
