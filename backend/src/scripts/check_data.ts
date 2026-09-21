import mongoose from 'mongoose';
import { connectDatabase, logConnectionError } from '../config/database.ts';
import { Exercise } from '../models/Exercise.model.ts';
import { MuscleGroup } from '../models/MuscleGroup.model.ts';
import { User } from '../models/User.model.ts';
import { Workout } from '../models/Workout.model.ts';
import { WorkoutSession } from '../models/WorkoutSession.model.ts';

try {
  await connectDatabase();
} catch (error) {
  logConnectionError(error);
  process.exit(1);
}

try {
  const muscleGroups = await MuscleGroup.find().sort({ name: 1 });
  console.log(`\nFound ${muscleGroups.length} muscle groups:`);
  for (const group of muscleGroups) {
    const exerciseCount = await Exercise.countDocuments({ belongsTo: group._id });
    console.log(` - ${group.name}: ${exerciseCount} exercises`);
  }

  console.log(`\nExercises: ${await Exercise.countDocuments()}`);
  console.log(`Users: ${await User.countDocuments()}`);
  console.log(`Workouts: ${await Workout.countDocuments()}`);
  console.log(`Logged sessions: ${await WorkoutSession.countDocuments()}`);
} catch (error) {
  console.error('Error checking data:', error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
