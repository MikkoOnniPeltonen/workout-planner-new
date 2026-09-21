import { zodResolver } from '@hookform/resolvers/zod';
import {
  WORKOUT_MAX_EXERCISES,
  type Workout,
  type WorkoutInput,
  workoutInputSchema,
} from '@workout-planner/shared';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { PageLoader } from '@/components/feedback';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormError, FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { ExercisePicker } from '@/components/workouts/ExercisePicker';
import { useCreateWorkout, useExercises, useUpdateWorkout } from '@/hooks/queries';
import { getErrorMessage } from '@/lib/api';

interface WorkoutFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this workout instead of creating a new one. */
  workout?: Workout;
}

export function WorkoutFormDialog({ open, onOpenChange, workout }: WorkoutFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <WorkoutForm
          key={workout?._id ?? 'new'}
          workout={workout}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function WorkoutForm({ workout, onDone }: { workout?: Workout; onDone: () => void }) {
  const exercisesQuery = useExercises();
  const createWorkout = useCreateWorkout();
  const updateWorkout = useUpdateWorkout();
  const [serverError, setServerError] = useState<string | null>(null);
  const isSaving = createWorkout.isPending || updateWorkout.isPending;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(workoutInputSchema),
    defaultValues: {
      name: workout?.name ?? '',
      exercises: workout?.exercises.map((exercise) => exercise._id) ?? [],
    },
  });

  const onSubmit = async (input: WorkoutInput) => {
    setServerError(null);
    try {
      if (workout) {
        await updateWorkout.mutateAsync({ id: workout._id, input });
      } else {
        await createWorkout.mutateAsync(input);
      }
      toast.success(workout ? 'Workout updated' : 'Workout created');
      onDone();
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{workout ? 'Edit workout' : 'New workout'}</DialogTitle>
        <DialogDescription>Name your workout and pick the exercises it includes.</DialogDescription>
      </DialogHeader>

      <div className="min-h-0 space-y-4 overflow-y-auto p-1">
        <FormField label="Workout name" htmlFor="workout-name" error={errors.name?.message}>
          <Input
            id="workout-name"
            placeholder="e.g. Leg Day Destruction"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'workout-name-error' : undefined}
            {...register('name')}
          />
        </FormField>

        <Controller
          control={control}
          name="exercises"
          render={({ field }) => (
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium">
                Exercises ({field.value.length}/{WORKOUT_MAX_EXERCISES})
              </legend>
              {exercisesQuery.isPending ? (
                <PageLoader label="Loading exercises…" />
              ) : (
                <ExercisePicker
                  exercises={exercisesQuery.data ?? []}
                  selectedIds={field.value}
                  maxSelected={WORKOUT_MAX_EXERCISES}
                  onToggle={(exercise) =>
                    field.onChange(
                      field.value.includes(exercise._id)
                        ? field.value.filter((id) => id !== exercise._id)
                        : [...field.value, exercise._id],
                    )
                  }
                />
              )}
              {errors.exercises?.message && (
                <p className="text-sm text-red-400">{errors.exercises.message}</p>
              )}
            </fieldset>
          )}
        />

        {serverError && <FormError message={serverError} />}
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : workout ? 'Save changes' : 'Create workout'}
        </Button>
      </DialogFooter>
    </form>
  );
}
