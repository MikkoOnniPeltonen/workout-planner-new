import { Exercise } from '../models/Exercise.model.ts';
import type { ExerciseType } from '../models/Exercise.model.ts';

import { MuscleGroup } from '../models/MuscleGroup.model.ts';

class ExerciseService {
    async getAllExercises(muscleGroups?: string) {
        let query = {};

        if (muscleGroups) {
            const groupNames = muscleGroups.split(',').map(name => name.trim());
            const groups = await MuscleGroup.find({ name: { $in: groupNames } });
            const groupIds = groups.map(g => g._id);
            query = { belongsTo: { $in: groupIds } };
        }

        // Populate the belongsTo field to get MuscleGroup details
        const exercises = await Exercise.find(query).populate('belongsTo');
        return exercises;
    }

    async getExerciseById(id: string) {
        const exercise = await Exercise.findById(id).populate('belongsTo');
        return exercise;
    }

    // Placeholder for future use, though not explicit in legacy requirement
    async createExercise(exerciseData: Partial<ExerciseType>) {
        const newExercise = await Exercise.create(exerciseData);
        return newExercise;
    }
}

export const exerciseService = new ExerciseService();
