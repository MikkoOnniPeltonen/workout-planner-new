import type { Exercise } from '@workout-planner/shared';

export function muscleGroupNamesOf(exercises: Exercise[]): string[] {
  const names = exercises.flatMap((exercise) => exercise.belongsTo.map((group) => group.name));
  return [...new Set(names)].sort();
}

export function filterExercises(
  exercises: Exercise[],
  query: string,
  muscleGroup: string | null,
): Exercise[] {
  const search = query.trim().toLowerCase();
  return exercises.filter(
    (exercise) =>
      (!search || exercise.name.toLowerCase().includes(search)) &&
      (!muscleGroup || exercise.belongsTo.some((group) => group.name === muscleGroup)),
  );
}
