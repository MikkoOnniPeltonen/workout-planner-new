import { zodResolver } from '@hookform/resolvers/zod';
import { type Exercise, WORKOUT_MAX_EXERCISES, workoutInputSchema } from '@workout-planner/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Plus, Shuffle, X } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ErrorState, PageLoader } from '@/components/feedback';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
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
import {
  useCreateWorkout,
  useExercises,
  useMuscleGroups,
  useRecentExercises,
  useSessionStats,
} from '@/hooks/queries';
import { getErrorMessage } from '@/lib/api';
import { formatDaysAgo, formatExerciseName } from '@/lib/format';
import {
  equipmentOptions,
  filterByEquipment,
  generatePlan,
  leastRecentlyTrained,
  type PlannedExercise,
  type PlanStep,
  planSteps,
  type Selections,
  swapExercise,
  withAvailableGroups,
} from '@/lib/plan';
import { cn } from '@/lib/utils';

const nameSchema = workoutInputSchema.pick({ name: true });

const emptySelections: Selections = Object.fromEntries(planSteps.map((step) => [step.id, []]));

interface PlanState {
  /** The inputs this plan was generated from, so it is only rebuilt when they change. */
  selections: Selections;
  equipment: string[] | null;
  items: PlannedExercise[];
}

export default function WorkoutWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quickStart = searchParams.get('quick') === '1';
  const exercisesQuery = useExercises();
  const muscleGroupsQuery = useMuscleGroups();
  // Training history makes the wizard adaptive; without it the wizard still works.
  const statsQuery = useSessionStats();
  const recentExercisesQuery = useRecentExercises();
  const createWorkout = useCreateWorkout();

  const [stepIndex, setStepIndex] = useState(0);
  const [selections, setSelections] = useState<Selections>(emptySelections);
  /** Equipment available today; null means everything. */
  const [equipment, setEquipment] = useState<string[] | null>(null);
  const [plan, setPlan] = useState<PlanState | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const advanceTimer = useRef<number | undefined>(undefined);
  const quickStartApplied = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: quickStart ? 'Quick start' : '' },
  });

  const steps = useMemo(
    () =>
      muscleGroupsQuery.data
        ? withAvailableGroups(
            planSteps,
            muscleGroupsQuery.data.map((group) => group.name),
          )
        : planSteps,
    [muscleGroupsQuery.data],
  );
  const exercises = exercisesQuery.data;
  const allEquipment = useMemo(() => equipmentOptions(exercises ?? []), [exercises]);
  const availableExercises = useMemo(
    () => filterByEquipment(exercises ?? [], equipment),
    [exercises, equipment],
  );
  const recentExerciseIds = useMemo(
    () => new Set(recentExercisesQuery.data ?? []),
    [recentExercisesQuery.data],
  );

  const equipmentStepIndex = steps.length;
  const reviewStepIndex = steps.length + 1;
  const totalSteps = steps.length + 2;
  const isReview = stepIndex === reviewStepIndex;
  const step: PlanStep | undefined = steps[stepIndex];
  const planItems = plan?.items ?? [];

  const stats = statsQuery.data;
  const recommendedGroup =
    stats && stats.totalSessions > 0
      ? leastRecentlyTrained(steps[0]?.options ?? [], stats.lastTrainedByMuscleGroup)
      : undefined;

  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

  // A first workout should be available with one decision. Users can still edit every choice
  // after the plan is generated, but they do not need to understand the full wizard first.
  useEffect(() => {
    if (!quickStart || quickStartApplied.current || !exercises || !muscleGroupsQuery.data) return;
    quickStartApplied.current = true;
    const primary = recommendedGroup ?? steps[0]?.options[0];
    setSelections({ ...emptySelections, primary: primary ? [primary] : [] });
    setStepIndex(reviewStepIndex);
  }, [quickStart, exercises, muscleGroupsQuery.data, recommendedGroup, steps, reviewStepIndex]);

  // Build a plan when the review step is reached, and rebuild it when its inputs changed.
  useEffect(() => {
    if (!isReview || !exercises) return;
    setPlan((current) =>
      current?.selections === selections && current.equipment === equipment
        ? current
        : {
            selections,
            equipment,
            items: generatePlan(availableExercises, selections, { steps, recentExerciseIds }),
          },
    );
  }, [isReview, exercises, selections, equipment, availableExercises, steps, recentExerciseIds]);

  function toggleGroup(currentStep: PlanStep, group: string) {
    const selected = selections[currentStep.id] ?? [];
    const wasSelected = selected.includes(group);

    let next: string[];
    if (wasSelected) {
      next = selected.filter((name) => name !== group);
    } else if (currentStep.maxSelections === 1) {
      next = [group];
    } else if (selected.length < currentStep.maxSelections) {
      next = [...selected, group];
    } else {
      toast.info(`Pick up to ${currentStep.maxSelections} groups.`);
      return;
    }
    setSelections({ ...selections, [currentStep.id]: next });

    // Picking the primary focus moves straight on to the next step.
    if (!wasSelected && stepIndex === 0) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = window.setTimeout(() => setStepIndex(1), 300);
    }
  }

  function toggleEquipment(item: string) {
    const current = equipment ?? allEquipment;
    const next = current.includes(item)
      ? current.filter((value) => value !== item)
      : [...current, item];
    setEquipment(next.length === allEquipment.length ? null : next);
  }

  function updatePlanItems(items: PlannedExercise[]) {
    setPlan((current) => (current ? { ...current, items } : current));
  }

  function reshuffle() {
    setPlan({
      selections,
      equipment,
      items: generatePlan(availableExercises, selections, { steps, recentExerciseIds }),
    });
  }

  function handleSwap(index: number) {
    const next = swapExercise(planItems, index, availableExercises, selections, {
      recentExerciseIds,
    });
    if (next === planItems) {
      toast.info('No other exercises match this focus.');
    } else {
      updatePlanItems(next);
    }
  }

  function handleToggleExercise(exercise: Exercise) {
    const inPlan = planItems.some((item) => item.exercise._id === exercise._id);
    updatePlanItems(
      inPlan
        ? planItems.filter((item) => item.exercise._id !== exercise._id)
        : [...planItems, { exercise, stepId: 'custom' }],
    );
  }

  const onSubmit = ({ name }: { name: string }) => {
    createWorkout.mutate(
      { name, exercises: planItems.map((item) => item.exercise._id) },
      {
        onSuccess: () => {
          toast.success('Workout saved');
          navigate('/dashboard');
        },
      },
    );
  };

  if (exercisesQuery.isPending || muscleGroupsQuery.isPending) {
    return <PageLoader label="Loading exercises…" />;
  }

  if (exercisesQuery.isError || muscleGroupsQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(exercisesQuery.error ?? muscleGroupsQuery.error)}
        onRetry={() => {
          exercisesQuery.refetch();
          muscleGroupsQuery.refetch();
        }}
      />
    );
  }

  let title = 'Review & save';
  let description = 'Name your workout and fine-tune the exercises.';
  let canContinue = true;
  let content: ReactNode;

  if (step) {
    title = step.title;
    description = step.description;
    canContinue = !step.required || (selections[step.id]?.length ?? 0) > 0;
    content = (
      <fieldset>
        <legend className="sr-only">{step.title}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {step.options.map((group) => {
            const selected = selections[step.id]?.includes(group) ?? false;
            const lastTrained = stats?.lastTrainedByMuscleGroup[group];
            return (
              <Button
                key={group}
                type="button"
                variant={selected ? 'default' : 'outline'}
                aria-pressed={selected}
                onClick={() => toggleGroup(step, group)}
                className="h-auto min-h-16 flex-col items-stretch gap-1 px-5 py-3 text-left whitespace-normal"
              >
                <span className="flex items-center justify-between gap-2 text-lg">
                  <span>{group}</span>
                  <span className="flex items-center gap-2">
                    {group === recommendedGroup && (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          selected ? 'bg-primary-foreground/15' : 'bg-primary/15 text-primary',
                        )}
                      >
                        Recommended
                      </span>
                    )}
                    {selected && <Check aria-hidden="true" />}
                  </span>
                </span>
                {stats && (
                  <span
                    className={cn(
                      'text-xs font-normal',
                      selected ? 'text-primary-foreground/80' : 'text-muted-foreground',
                    )}
                  >
                    {lastTrained ? `Trained ${formatDaysAgo(lastTrained)}` : 'Not trained yet'}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
        {step.options.length === 0 && (
          <p className="text-sm text-muted-foreground">No muscle groups available for this step.</p>
        )}
      </fieldset>
    );
  } else if (stepIndex === equipmentStepIndex) {
    title = 'Equipment';
    description = 'What do you have available today? Exercises are picked to match.';
    canContinue = equipment === null || equipment.length > 0;
    content = (
      <fieldset className="space-y-3">
        <legend className="sr-only">Equipment available today</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {allEquipment.map((item) => {
            const selected = equipment === null || equipment.includes(item);
            return (
              <Button
                key={item}
                type="button"
                variant={selected ? 'default' : 'outline'}
                aria-pressed={selected}
                onClick={() => toggleEquipment(item)}
                className="h-12 justify-between px-5 capitalize"
              >
                {item}
                {selected && <Check aria-hidden="true" />}
              </Button>
            );
          })}
        </div>
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          {equipment === null
            ? 'Everything is available.'
            : `${availableExercises.length} of ${exercises?.length ?? 0} exercises match.`}
          {equipment !== null && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto px-0"
              onClick={() => setEquipment(null)}
            >
              Select all
            </Button>
          )}
        </p>
      </fieldset>
    );
  } else {
    content = (
      <form id="workout-form" noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField label="Workout name" htmlFor="workout-name" error={errors.name?.message}>
          <Input
            id="workout-name"
            placeholder="e.g. Monday Morning Grind"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'workout-name-error' : undefined}
            {...register('name')}
          />
        </FormField>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium">
              Your plan ({planItems.length} {planItems.length === 1 ? 'exercise' : 'exercises'})
            </h3>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={reshuffle}>
                <Shuffle aria-hidden="true" />
                Shuffle all
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                <Plus aria-hidden="true" />
                Add
              </Button>
            </div>
          </div>

          {planItems.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No exercises in the plan yet. Shuffle or add some.
            </p>
          ) : (
            <ol aria-label="Planned exercises" className="space-y-2">
              {planItems.map((item, index) => {
                const name = formatExerciseName(item.exercise.name);
                return (
                  <li
                    key={item.exercise._id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.exercise.belongsTo.map((group) => group.name).join(', ')}
                      </p>
                    </div>
                    {item.stepId !== 'custom' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSwap(index)}
                        aria-label={`Swap ${name}`}
                      >
                        <Shuffle aria-hidden="true" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => updatePlanItems(planItems.filter((_, i) => i !== index))}
                      aria-label={`Remove ${name}`}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {createWorkout.isError && <FormError message={getErrorMessage(createWorkout.error)} />}
      </form>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate a workout</h1>
        <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Step {stepIndex + 1} of {totalSteps}
          </span>
          <span>{title}</span>
        </div>
        <div
          role="progressbar"
          aria-label="Wizard progress"
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-valuenow={stepIndex + 1}
          className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"
        >
          <motion.div
            className="h-full bg-primary"
            initial={false}
            animate={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <CardHeader>
              <h2 className="font-semibold leading-none tracking-tight">{title}</h2>
              <CardDescription>{description}</CardDescription>
            </CardHeader>

            <CardContent>{content}</CardContent>

            <CardFooter className="justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStepIndex((index) => index - 1)}
                disabled={stepIndex === 0}
              >
                Previous
              </Button>
              {isReview ? (
                <Button
                  type="submit"
                  form="workout-form"
                  disabled={planItems.length === 0 || createWorkout.isPending}
                >
                  {createWorkout.isPending ? 'Saving…' : 'Save workout'}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => setStepIndex((index) => index + 1)}
                  disabled={!canContinue}
                >
                  Next
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add exercises</DialogTitle>
            <DialogDescription>
              Tap exercises to add them to your plan or remove them.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 overflow-y-auto p-1">
            <ExercisePicker
              exercises={exercises ?? []}
              selectedIds={planItems.map((item) => item.exercise._id)}
              maxSelected={WORKOUT_MAX_EXERCISES}
              onToggle={handleToggleExercise}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button>Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
