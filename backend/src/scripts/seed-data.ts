import type { ExerciseMetric } from '@workout-planner/shared';
import type { Types } from 'mongoose';
import { Exercise } from '../models/Exercise.model.ts';
import { MuscleGroup } from '../models/MuscleGroup.model.ts';

export const muscleGroupNames = [
  'Back',
  'Chest',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
  'Upper Back',
];

interface ExerciseSeed {
  name: string;
  groups: string[];
  usedWith: string[];
  description: string;
  metric?: ExerciseMetric;
}

export const exercisesData: ExerciseSeed[] = [
  // Back
  {
    name: 'Deadlift',
    groups: ['Back', 'Legs'],
    usedWith: ['barbell', 'dumbbells', 'kettlebell'],
    description:
      'Hinge at the hips and lift the weight from the floor to standing, keeping your back flat and the weight close to your legs.',
  },
  {
    name: 'Pull Up',
    groups: ['Back', 'Arms'],
    usedWith: ['pull-up bar'],
    description:
      'Hang from a bar with an overhand grip and pull your chest toward it, then lower under control.',
  },
  {
    name: 'Bent Over Row',
    groups: ['Back'],
    usedWith: ['barbell', 'dumbbells'],
    description:
      'Hinge forward with a flat back and row the weight to your lower ribs, squeezing your shoulder blades together.',
  },
  {
    name: 'Lat Pulldown',
    groups: ['Back'],
    usedWith: ['cable', 'machine'],
    description:
      'Pull the bar down to your upper chest with your torso upright, then let it rise slowly.',
  },

  // Chest
  {
    name: 'Bench Press',
    groups: ['Chest', 'Arms'],
    usedWith: ['barbell', 'dumbbells'],
    description:
      'Lie on a bench, lower the weight to mid-chest and press it back up until your arms are straight.',
  },
  {
    name: 'Push Up',
    groups: ['Chest', 'Core', 'Arms'],
    usedWith: ['bodyweight'],
    description:
      'Keep a straight line from head to heels, lower your chest to just above the floor and push back up.',
  },
  {
    name: 'Incline Dumbbell Press',
    groups: ['Chest'],
    usedWith: ['dumbbells'],
    description:
      'On a bench set to 30–45°, press the dumbbells up over your upper chest and lower them slowly.',
  },

  // Legs
  {
    name: 'Squat',
    groups: ['Legs', 'Core'],
    usedWith: ['barbell', 'dumbbells', 'kettlebell', 'bodyweight'],
    description:
      'Sit your hips back and down until your thighs are at least parallel to the floor, then drive up through your heels.',
  },
  {
    name: 'Lunge',
    groups: ['Legs'],
    usedWith: ['bodyweight', 'dumbbells', 'barbell'],
    description:
      'Step forward and lower until both knees are bent about 90°, then push back to standing. Alternate legs.',
  },
  {
    name: 'Leg Press',
    groups: ['Legs'],
    usedWith: ['machine'],
    description:
      'Press the platform away until your legs are almost straight, then lower until your knees reach about 90°.',
  },
  {
    name: 'Romanian Deadlift',
    groups: ['Legs', 'Back'],
    usedWith: ['barbell', 'dumbbells', 'kettlebell'],
    description:
      'With soft knees, hinge at the hips and lower the weight along your legs until you feel a hamstring stretch, then stand tall.',
  },
  {
    name: 'Glute Bridge',
    groups: ['Legs', 'Core'],
    usedWith: ['bodyweight', 'barbell', 'dumbbells'],
    description:
      'Lie on your back with feet flat, drive your hips up until your body forms a straight line, pause, and lower.',
  },

  // Shoulders
  {
    name: 'Overhead Press',
    groups: ['Shoulders', 'Arms'],
    usedWith: ['barbell', 'dumbbells', 'kettlebell'],
    description:
      'Press the weight from your shoulders to straight overhead without arching your lower back.',
  },
  {
    name: 'Lateral Raise',
    groups: ['Shoulders'],
    usedWith: ['dumbbells', 'cable'],
    description:
      'With a slight bend in the elbows, raise the weights out to your sides to shoulder height.',
  },
  {
    name: 'Front Raise',
    groups: ['Shoulders'],
    usedWith: ['dumbbells', 'cable', 'barbell'],
    description:
      'Raise the weight in front of you to shoulder height with straight arms, then lower slowly.',
  },
  {
    name: 'Pike Push Up',
    groups: ['Shoulders', 'Arms'],
    usedWith: ['bodyweight'],
    description:
      'From a downward-dog position, bend your elbows to lower your head toward the floor and press back up.',
  },

  // Arms
  {
    name: 'Bicep Curl',
    groups: ['Arms'],
    usedWith: ['dumbbells', 'barbell', 'cable'],
    description:
      'Keep your elbows at your sides and curl the weight up to your shoulders, then lower under control.',
  },
  {
    name: 'Tricep Dip',
    groups: ['Arms', 'Chest'],
    usedWith: ['bodyweight'],
    description:
      'On parallel bars or a bench edge, lower your body until your elbows reach about 90°, then press back up.',
  },
  {
    name: 'Hammer Curl',
    groups: ['Arms'],
    usedWith: ['dumbbells'],
    description:
      'Curl with your palms facing each other to work the biceps and forearms, keeping your elbows still.',
  },

  // Core
  {
    name: 'Plank',
    groups: ['Core'],
    usedWith: ['bodyweight'],
    metric: 'time',
    description:
      'Hold a straight line from head to heels on your forearms, bracing your abs and glutes.',
  },
  {
    name: 'Russian Twist',
    groups: ['Core'],
    usedWith: ['bodyweight', 'dumbbells', 'kettlebell'],
    description:
      'Sit with your feet raised, lean back slightly and rotate your torso from side to side.',
  },
  {
    name: 'Leg Raise',
    groups: ['Core'],
    usedWith: ['bodyweight', 'pull-up bar'],
    description:
      'Lying flat or hanging from a bar, raise straight legs to 90° without swinging, then lower slowly.',
  },
  {
    name: 'Crunch',
    groups: ['Core'],
    usedWith: ['bodyweight'],
    description:
      'Curl your shoulders off the floor by contracting your abs, keeping your lower back down.',
  },

  // Upper back
  {
    name: 'Shrug',
    groups: ['Upper Back'],
    usedWith: ['dumbbells', 'barbell'],
    description:
      'Hold the weight at your sides and lift your shoulders straight up toward your ears, pause, and lower.',
  },
  {
    name: 'Face Pull',
    groups: ['Upper Back', 'Shoulders'],
    usedWith: ['cable'],
    description:
      'Pull a rope attachment toward your face with your elbows high, squeezing your rear shoulders and upper back.',
  },
  {
    name: 'Reverse Fly',
    groups: ['Upper Back', 'Shoulders'],
    usedWith: ['dumbbells', 'cable', 'machine'],
    description:
      'Hinge forward and raise the weights out to your sides, squeezing your shoulder blades together.',
  },
  {
    name: 'Inverted Row',
    groups: ['Upper Back', 'Back'],
    usedWith: ['bodyweight'],
    description:
      'Hang under a fixed bar with your body straight and pull your chest up to it, then lower under control.',
  },
];

/**
 * Idempotent: upserts by name, so muscle group and exercise ids stay stable across runs and
 * existing workouts keep pointing at valid exercises.
 */
export async function seedDatabase() {
  const groupIds = new Map<string, Types.ObjectId>();

  for (const name of muscleGroupNames) {
    const group = await MuscleGroup.findOneAndUpdate(
      { name },
      { $set: { name } },
      { upsert: true, returnDocument: 'after' },
    ).orFail();
    groupIds.set(name, group._id);
  }

  for (const exercise of exercisesData) {
    const belongsTo = exercise.groups.map((groupName) => {
      const id = groupIds.get(groupName);
      if (!id) {
        throw new Error(`Unknown muscle group "${groupName}" for exercise "${exercise.name}".`);
      }
      return id;
    });

    await Exercise.updateOne(
      { name: exercise.name.toLowerCase() },
      {
        $set: {
          description: exercise.description,
          belongsTo,
          usedWith: exercise.usedWith,
          metric: exercise.metric ?? 'reps',
        },
      },
      { upsert: true },
    );
  }

  return { muscleGroups: muscleGroupNames.length, exercises: exercisesData.length };
}
