import type { Exercise } from '@workout-planner/shared';
import { Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SearchInput } from '@/components/ui/search-input';
import { MuscleGroupFilter } from '@/components/workouts/MuscleGroupFilter';
import { filterExercises, muscleGroupNamesOf } from '@/lib/exercises';
import { formatExerciseName } from '@/lib/format';
import { cn } from '@/lib/utils';

interface ExercisePickerProps {
  exercises: Exercise[];
  selectedIds: string[];
  onToggle: (exercise: Exercise) => void;
  maxSelected?: number;
}

/** Searchable, filterable exercise selection used by the workout dialog, wizard and logger. */
export function ExercisePicker({
  exercises,
  selectedIds,
  onToggle,
  maxSelected,
}: ExercisePickerProps) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string | null>(null);

  const groups = useMemo(() => muscleGroupNamesOf(exercises), [exercises]);
  const visible = filterExercises(exercises, query, group);
  const limitReached = maxSelected !== undefined && selectedIds.length >= maxSelected;

  return (
    <div className="space-y-3">
      <SearchInput
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search exercises"
        aria-label="Search exercises"
      />
      <MuscleGroupFilter groups={groups} value={group} onChange={setGroup} />

      <ul className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {visible.map((exercise) => {
          const selected = selectedIds.includes(exercise._id);
          return (
            <li key={exercise._id}>
              <button
                type="button"
                aria-pressed={selected}
                disabled={!selected && limitReached}
                onClick={() => onToggle(exercise)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                  selected
                    ? 'border-primary bg-primary/15'
                    : 'border-border bg-background hover:border-primary/50',
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {formatExerciseName(exercise.name)}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {exercise.belongsTo.map((muscleGroup) => muscleGroup.name).join(', ')}
                  </span>
                </span>
                {selected && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="col-span-full py-6 text-center text-sm text-muted-foreground">
            No exercises match your search.
          </li>
        )}
      </ul>
    </div>
  );
}
