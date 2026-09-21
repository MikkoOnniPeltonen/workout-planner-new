import type { Exercise } from '@workout-planner/shared';
import { motion } from 'framer-motion';
import { Dumbbell } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState, ErrorState, PageLoader } from '@/components/feedback';
import { PageHeader } from '@/components/PageHeader';
import { SearchInput } from '@/components/ui/search-input';
import { MuscleGroupFilter } from '@/components/workouts/MuscleGroupFilter';
import { useExercises } from '@/hooks/queries';
import { getErrorMessage } from '@/lib/api';
import { filterExercises, muscleGroupNamesOf } from '@/lib/exercises';
import { formatExerciseName } from '@/lib/format';

interface ExerciseFlipCardProps {
  exercise: Exercise;
  flipped: boolean;
  onFlip: () => void;
}

function ExerciseFlipCard({ exercise, flipped, onFlip }: ExerciseFlipCardProps) {
  return (
    <button
      type="button"
      onClick={onFlip}
      aria-pressed={flipped}
      className="block h-72 w-full rounded-xl text-left perspective-distant focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <motion.span
        className="relative block size-full transform-3d"
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {/* Front */}
        <span
          aria-hidden={flipped}
          className="absolute inset-0 flex flex-col gap-3 rounded-xl border border-border bg-card p-6 backface-hidden"
        >
          <span className="text-xl font-semibold">{formatExerciseName(exercise.name)}</span>
          <span className="flex flex-wrap gap-1.5">
            {exercise.belongsTo.map((group) => (
              <span
                key={group._id}
                className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary"
              >
                {group.name}
              </span>
            ))}
          </span>
          <span className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
            {exercise.description}
          </span>
          <span className="mt-auto text-xs text-muted-foreground">Tap to see equipment</span>
        </span>

        {/* Back */}
        <span
          aria-hidden={!flipped}
          className="absolute inset-0 flex rotate-y-180 flex-col gap-4 rounded-xl border border-border bg-background p-6 backface-hidden"
        >
          <span className="text-lg font-semibold">Equipment</span>
          <span className="flex flex-wrap gap-2">
            {exercise.usedWith.length > 0 ? (
              exercise.usedWith.map((item) => (
                <span key={item} className="rounded-full bg-secondary px-3 py-1 text-xs capitalize">
                  {item}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No special equipment</span>
            )}
          </span>
          <span className="text-sm text-muted-foreground">
            {exercise.metric === 'time'
              ? 'Logged as time held, in seconds.'
              : 'Logged as reps, with optional weight.'}
          </span>
        </span>
      </motion.span>
    </button>
  );
}

function AllExercisesPage() {
  const exercisesQuery = useExercises();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string | null>(null);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  const exercises = exercisesQuery.data ?? [];
  const groups = useMemo(
    () => muscleGroupNamesOf(exercisesQuery.data ?? []),
    [exercisesQuery.data],
  );
  const visible = filterExercises(exercises, query, group);

  if (exercisesQuery.isPending) {
    return <PageLoader label="Loading exercises…" />;
  }

  if (exercisesQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(exercisesQuery.error)}
        onRetry={() => exercisesQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exercise library"
        description="Every exercise, what it trains, and what you need to do it."
      />

      <div className="space-y-3">
        <SearchInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search exercises"
          aria-label="Search exercises"
          className="max-w-md"
        />
        <MuscleGroupFilter groups={groups} value={group} onChange={setGroup} />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No exercises found"
          description="Try a different search or muscle group."
        />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((exercise) => (
            <li key={exercise._id}>
              <ExerciseFlipCard
                exercise={exercise}
                flipped={Boolean(flipped[exercise._id])}
                onFlip={() =>
                  setFlipped((current) => ({ ...current, [exercise._id]: !current[exercise._id] }))
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AllExercisesPage;
