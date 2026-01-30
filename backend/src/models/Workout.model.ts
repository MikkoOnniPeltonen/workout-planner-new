import { Schema, model, type InferSchemaType } from 'mongoose';

const workoutSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required.'],
            unique: true,
            lowercase: true,
            trim: true
        },
        belongsTo: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        exercises: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Exercise'
            }
        ]
    },
    {
        timestamps: true
    }
);

export type WorkoutType = InferSchemaType<typeof workoutSchema>;
export const Workout = model('Workout', workoutSchema);
