import type { Workout } from '@workout-planner/shared';
import { Pencil, Play, Trash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { muscleGroupNamesOf } from '@/lib/exercises';
import { formatDaysAgo, formatExerciseName } from '@/lib/format';

interface WorkoutCardProps {
  workout: Workout;
  /** ISO date of the most recent session logged with this workout. */
  lastPerformedAt?: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function WorkoutCard({ workout, lastPerformedAt, onEdit, onDelete }: WorkoutCardProps) {
  const groups = muscleGroupNamesOf(workout.exercises);
  const count = workout.exercises.length;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0 space-y-1.5">
          <CardTitle className="truncate text-lg">{workout.name}</CardTitle>
          <CardDescription>
            {count} {count === 1 ? 'exercise' : 'exercises'}
            {groups.length > 0 && ` · ${groups.join(', ')}`}
          </CardDescription>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Edit ${workout.name}`}>
            <Pencil aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label={`Delete ${workout.name}`}
            className="hover:text-red-400"
          >
            <Trash aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="flex flex-wrap gap-2">
          {workout.exercises.map((exercise) => (
            <li
              key={exercise._id}
              className="rounded-full border border-border bg-secondary px-3 py-1 text-xs"
            >
              {formatExerciseName(exercise.name)}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {lastPerformedAt ? `Last done ${formatDaysAgo(lastPerformedAt)}` : 'Not done yet'}
        </p>
        <Button asChild size="sm">
          <Link to={`/workouts/${workout._id}/log`} aria-label={`Start workout: ${workout.name}`}>
            <Play aria-hidden="true" />
            Start workout
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
