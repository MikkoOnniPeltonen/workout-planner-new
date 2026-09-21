import { Exercise } from '../models/Exercise.model.ts';
import { MuscleGroup } from '../models/MuscleGroup.model.ts';
import { HttpError } from '../utils/http-error.ts';

const caseInsensitive = { locale: 'en', strength: 2 };

class ExerciseService {
  async assertExercisesExist(exerciseIds: string[]) {
    const uniqueIds = [...new Set(exerciseIds)];
    const found = await Exercise.countDocuments({ _id: { $in: uniqueIds } });
    if (found !== uniqueIds.length) {
      throw new HttpError(400, 'One or more exercises do not exist.');
    }
  }

  async getAllExercises(muscleGroupNames: string[] = []) {
    if (muscleGroupNames.length === 0) {
      return Exercise.find().sort({ name: 1 }).populate('belongsTo');
    }

    const groups = await MuscleGroup.find({ name: { $in: muscleGroupNames } }).collation(
      caseInsensitive,
    );
    const groupIds = groups.map((group) => group._id);

    return Exercise.find({ belongsTo: { $in: groupIds } })
      .sort({ name: 1 })
      .populate('belongsTo');
  }

  async getExerciseById(id: string) {
    return Exercise.findById(id).populate('belongsTo');
  }
}

export const exerciseService = new ExerciseService();
