import { type InferSchemaType, model, Schema } from 'mongoose';

const muscleGroupSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export type MuscleGroupType = InferSchemaType<typeof muscleGroupSchema>;
export const MuscleGroup = model('MuscleGroup', muscleGroupSchema);
