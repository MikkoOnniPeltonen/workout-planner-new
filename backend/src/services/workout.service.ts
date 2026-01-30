import { Workout } from '../models/Workout.model.ts';
import type { WorkoutType } from '../models/Workout.model.ts';

class WorkoutService {
    async getAllWorkouts(userId: string) {
        return await Workout.find({ belongsTo: userId }).populate({
            path: 'exercises',
            populate: {
                path: 'belongsTo'
            }
        });
    }

    async getWorkoutById(id: string) {
        return await Workout.findById(id).populate({
            path: 'exercises',
            populate: {
                path: 'belongsTo'
            }
        });
    }

    async createWorkout(workoutData: Partial<WorkoutType> & { belongsTo: string }) {
        return await Workout.create(workoutData);
    }

    async updateWorkout(id: string, userId: string, workoutData: Partial<WorkoutType>) {
        // IDOR FIX: Ensure we also match 'belongsTo: userId'
        return await Workout.findOneAndUpdate(
            { _id: id, belongsTo: userId },
            workoutData,
            { new: true }
        ).populate({
            path: 'exercises',
            populate: {
                path: 'belongsTo'
            }
        });
    }

    async deleteWorkout(id: string, userId: string) {
        // IDOR FIX: Ensure we also match 'belongsTo: userId'
        return await Workout.findOneAndDelete({ _id: id, belongsTo: userId });
    }
}

export const workoutService = new WorkoutService();
