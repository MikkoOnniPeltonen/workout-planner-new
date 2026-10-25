import mongoose from 'mongoose';
import '../models/AuthSession.model.ts';
import '../models/Exercise.model.ts';
import '../models/MuscleGroup.model.ts';
import '../models/User.model.ts';
import '../models/Workout.model.ts';
import '../models/WorkoutSession.model.ts';
import { connectDatabase } from '../config/database.ts';

try {
  await connectDatabase();
  // Creates declared indexes; never drops undeclared indexes automatically.
  for (const model of Object.values(mongoose.models)) {
    await model.createIndexes();
    console.log(`Ensured indexes for ${model.modelName}`);
  }
} finally {
  await mongoose.disconnect();
}
