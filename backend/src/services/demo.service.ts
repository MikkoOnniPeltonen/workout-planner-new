import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Exercise } from '../models/Exercise.model.ts';
import { User } from '../models/User.model.ts';
import { Workout } from '../models/Workout.model.ts';
import { WorkoutSession } from '../models/WorkoutSession.model.ts';
import { HttpError } from '../utils/http-error.ts';

export async function createDemo() {
  const exercises = await Exercise.find().sort({ name: 1 }).limit(18);
  if (exercises.length < 6)
    throw new HttpError(503, 'The demo is being prepared. Please try again shortly.');
  const expiresAt = new Date(Date.now() + 24 * 3600000);
  // Demo credentials are random and never shared. Each visitor gets separate data.
  const user = await User.create({
    name: 'Demo athlete',
    email: `demo-${randomUUID()}@example.invalid`,
    password: await bcrypt.hash(randomUUID(), 10),
    expiresAt,
  });
  try {
    const workouts = await Workout.create([
      {
        name: 'Strength foundations',
        belongsTo: user._id,
        exercises: exercises.slice(0, 6).map((e) => e._id),
        expiresAt,
      },
      {
        name: 'Weekend training',
        belongsTo: user._id,
        exercises: exercises.slice(6, 12).map((e) => e._id),
        expiresAt,
      },
    ]);
    const sessions = Array.from({ length: 36 }, (_, i) => {
      const workout = workouts[i % 2];
      const performedAt = new Date(Date.now() - (84 - i * 2.35) * 86400000);
      return {
        belongsTo: user._id,
        workout: workout._id,
        workoutName: workout.name,
        performedAt,
        durationMinutes: 40 + (i % 15),
        expiresAt,
        entries: exercises.slice(i % 2 ? 6 : 0, i % 2 ? 12 : 6).map((exercise, j) => ({
          exercise: exercise._id,
          sets: Array.from({ length: 3 }, () =>
            exercise.metric === 'time'
              ? { durationSec: 30 + Math.floor(i / 6) * 5, completed: true }
              : { reps: 8, weightKg: 20 + j * 5 + Math.floor(i / 6) * 2.5, completed: true },
          ),
        })),
      };
    });
    await WorkoutSession.insertMany(sessions);
    return { _id: String(user._id), name: user.name, email: user.email };
  } catch (error) {
    await Promise.all([
      Workout.deleteMany({ belongsTo: user._id }),
      WorkoutSession.deleteMany({ belongsTo: user._id }),
      User.deleteOne({ _id: user._id }),
    ]);
    throw error;
  }
}
