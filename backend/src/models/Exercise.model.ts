import { Schema, model, type InferSchemaType, Types } from 'mongoose';

const exerciseSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required.'],
            unique: true,
            lowercase: true,
            trim: true
        },
        description: {
            type: String,
            required: [true, 'Description is required.']
        },
        belongsTo: [
            {
                type: Schema.Types.ObjectId,
                ref: 'MuscleGroup'
            }
        ],
        usedWith: [
            {
                type: String
            }
        ]
    },
    {
        timestamps: true
    }
);

export type ExerciseType = InferSchemaType<typeof exerciseSchema>;
export const Exercise = model('Exercise', exerciseSchema);
