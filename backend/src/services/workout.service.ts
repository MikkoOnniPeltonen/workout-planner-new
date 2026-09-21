import type { WorkoutInput } from '@workout-planner/shared';
import { Workout } from '../models/Workout.model.ts';
import { HttpError } from '../utils/http-error.ts';
import { isDuplicateKeyError } from '../utils/mongo-errors.ts';
import { exerciseService } from './exercise.service.ts';

const populateExercises = { path: 'exercises', populate: { path: 'belongsTo' } };

function toDuplicateNameError(error: unknown): unknown {
  return isDuplicateKeyError(error)
    ? new HttpError(409, 'You already have a workout with this name.')
    : error;
}

// Every query is scoped to the owner, so users can never read or change other users' workouts.
class WorkoutService {
  async getAllWorkouts(userId: string) {
    return Workout.find({ belongsTo: userId }).sort({ createdAt: -1 }).populate(populateExercises);
  }

  async getWorkoutById(id: string, userId: string) {
    return Workout.findOne({ _id: id, belongsTo: userId }).populate(populateExercises);
  }

  async createWorkout(userId: string, input: WorkoutInput) {
    await exerciseService.assertExercisesExist(input.exercises);
    try {
      const workout = await Workout.create({
        name: input.name,
        exercises: input.exercises,
        belongsTo: userId,
      });
      return await workout.populate(populateExercises);
    } catch (error) {
      throw toDuplicateNameError(error);
    }
  }

  async updateWorkout(id: string, userId: string, input: WorkoutInput) {
    await exerciseService.assertExercisesExist(input.exercises);
    try {
      return await Workout.findOneAndUpdate(
        { _id: id, belongsTo: userId },
        { $set: { name: input.name, exercises: input.exercises } },
        { returnDocument: 'after', runValidators: true },
      ).populate(populateExercises);
    } catch (error) {
      throw toDuplicateNameError(error);
    }
  }

  async deleteWorkout(id: string, userId: string) {
    return Workout.findOneAndDelete({ _id: id, belongsTo: userId });
  }
}

export const workoutService = new WorkoutService();
