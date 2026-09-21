import {
  type Exercise,
  SESSION_MAX_ENTRIES,
  type SessionSet,
  sessionInputSchema,
  sessionUpdateSchema,
} from '@workout-planner/shared';
import { Check, Dumbbell, Minus, Plus, Trash, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  type Control,
  type UseFormRegister,
  useFieldArray,
  useForm,
  useWatch,
} from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState, ErrorState, PageLoader } from '@/components/feedback';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { ExercisePicker } from '@/components/workouts/ExercisePicker';
import { RestTimer } from '@/components/workouts/RestTimer';
import { useAuth } from '@/context/auth.context';
import {
  useCreateSession,
  useExercises,
  useLastPerformance,
  useSession,
  useUpdateSession,
  useWorkout,
} from '@/hooks/queries';
import { getErrorMessage } from '@/lib/api';
import { clearDraft, loadDraft, saveDraft } from '@/lib/draft';
import { formatDate, formatExerciseName } from '@/lib/format';
import { describeIncrease, progressionTargets } from '@/lib/progression';
import {
  completeSet,
  countSets,
  emptySessionValues,
  isSessionFormValues,
  isSetFilled,
  newEntry,
  type SessionFormValues,
  sessionToFormValues,
  targetSet,
  toSessionPayload,
} from '@/lib/session-form';
import { formatSets } from '@/lib/sessions';
import { cn } from '@/lib/utils';

const DEFAULT_REST_SECONDS = 90;
const MIN_REST_SECONDS = 15;
const MAX_REST_SECONDS = 600;

/**
 * Logs a session. Three routes share it:
 * /workouts/:workoutId/log (follow a workout), /log (freestyle) and /sessions/:sessionId/edit.
 */
export default function LogSessionPage() {
  const { workoutId, sessionId } = useParams();
  const { user } = useAuth();
  const exercisesQuery = useExercises();
  const workoutQuery = useWorkout(workoutId);
  const sessionQuery = useSession(sessionId);

  const workoutExerciseIds = useMemo(
    () => workoutQuery.data?.exercises.map((exercise) => exercise._id) ?? [],
    [workoutQuery.data],
  );
  // Loaded up front so each exercise starts with as many set rows as last time.
  const lastPerformanceQuery = useLastPerformance(sessionId ? [] : workoutExerciseIds);

  const error = exercisesQuery.error ?? workoutQuery.error ?? sessionQuery.error;
  if (error) {
    return <ErrorState message={getErrorMessage(error)} />;
  }

  const loading =
    exercisesQuery.isPending ||
    (workoutId !== undefined && (workoutQuery.isPending || lastPerformanceQuery.isLoading)) ||
    (sessionId !== undefined && sessionQuery.isPending);
  if (loading || !exercisesQuery.data) {
    return <PageLoader label="Getting your session ready…" />;
  }

  const draftScope = workoutId ?? 'freestyle';
  const draftKey = sessionId ? null : `session-draft:v1:${user?._id ?? 'guest'}:${draftScope}`;
  const lastSetCounts = new Map(
    lastPerformanceQuery.data?.map((row) => [row.exercise, row.sets.length]),
  );

  let title = 'Freestyle session';
  let description = 'Add the exercises you train and tick off each set as you go.';
  let freshValues = emptySessionValues();

  if (sessionQuery.data) {
    title = sessionQuery.data.workoutName;
    description = `Logged ${formatDate(sessionQuery.data.performedAt)}`;
    freshValues = sessionToFormValues(sessionQuery.data);
  } else if (workoutQuery.data) {
    title = workoutQuery.data.name;
    description = 'Tick off each set as you go. An empty set is filled in with your target.';
    freshValues = emptySessionValues(
      workoutQuery.data.exercises.map((exercise) =>
        newEntry(exercise._id, lastSetCounts.get(exercise._id)),
      ),
    );
  }

  return (
    <SessionForm
      key={sessionId ?? draftScope}
      title={title}
      description={description}
      exercises={exercisesQuery.data}
      freshValues={freshValues}
      draftKey={draftKey}
      workoutId={workoutId}
      sessionId={sessionId}
    />
  );
}

interface SessionFormProps {
  title: string;
  description: string;
  exercises: Exercise[];
  /** Starting values when there is no draft, and what "Discard" resets to. */
  freshValues: SessionFormValues;
  /** Where unsaved changes are kept; null when editing an existing session. */
  draftKey: string | null;
  workoutId?: string;
  sessionId?: string;
}

function SessionForm({
  title,
  description,
  exercises,
  freshValues,
  draftKey,
  workoutId,
  sessionId,
}: SessionFormProps) {
  const navigate = useNavigate();
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();

  const [restoredDraft] = useState(() => {
    const draft = draftKey ? loadDraft(draftKey) : null;
    return isSessionFormValues(draft) ? draft : null;
  });
  const [showRestoredNotice, setShowRestoredNotice] = useState(restoredDraft !== null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<SessionFormValues | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [restSeconds, setRestSeconds] = useState(DEFAULT_REST_SECONDS);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);

  const { control, register, handleSubmit, getValues, setValue, reset, watch } =
    useForm<SessionFormValues>({ defaultValues: restoredDraft ?? freshValues });
  const { fields, append, remove } = useFieldArray({ control, name: 'entries' });
  const entries = useWatch({ control, name: 'entries' });

  const exerciseById = useMemo(
    () => new Map(exercises.map((exercise) => [exercise._id, exercise])),
    [exercises],
  );
  const metricOf = (exerciseId: string) => exerciseById.get(exerciseId)?.metric ?? 'reps';

  const exerciseIds = entries.map((entry) => entry.exerciseId);
  // When editing, "last time" would be this very session, so it is not shown.
  const lastPerformance = useLastPerformance(sessionId ? [] : exerciseIds);
  const lastSetsByExercise = useMemo(
    () => new Map((lastPerformance.data ?? []).map((row) => [row.exercise, row.sets])),
    [lastPerformance.data],
  );

  const { done, unticked } = countSets(entries, metricOf);
  const saving = createSession.isPending || updateSession.isPending;

  useEffect(() => {
    if (!draftKey) return;
    const subscription = watch((values) => saveDraft(draftKey, values));
    return () => subscription.unsubscribe();
  }, [watch, draftKey]);

  const discardDraft = () => {
    reset(freshValues);
    if (draftKey) clearDraft(draftKey);
    setShowRestoredNotice(false);
  };

  const toggleSet = (entryIndex: number, setIndex: number) => {
    const entry = getValues(`entries.${entryIndex}`);
    const set = entry.sets[setIndex];
    const path = `entries.${entryIndex}.sets.${setIndex}` as const;

    if (set.completed) {
      setValue(`${path}.completed`, false, { shouldDirty: true });
      return;
    }

    const metric = metricOf(entry.exerciseId);
    const targets = progressionTargets(lastSetsByExercise.get(entry.exerciseId), metric);
    const next = completeSet(set, targetSet(targets, setIndex));
    if (!isSetFilled(next, metric)) {
      toast.error(metric === 'time' ? 'Enter how many seconds first.' : 'Enter your reps first.');
      return;
    }

    setValue(`${path}.reps`, next.reps, { shouldDirty: true });
    setValue(`${path}.weightKg`, next.weightKg, { shouldDirty: true });
    setValue(`${path}.durationSec`, next.durationSec, { shouldDirty: true });
    setValue(`${path}.completed`, true, { shouldDirty: true });
    setRestEndsAt(Date.now() + restSeconds * 1000);
  };

  const adjustRest = (seconds: number) => {
    setRestSeconds((current) =>
      Math.min(MAX_REST_SECONDS, Math.max(MIN_REST_SECONDS, current + seconds)),
    );
    setRestEndsAt((current) =>
      current === null ? null : Math.max(Date.now(), current + seconds * 1000),
    );
  };

  const toggleExercise = (exercise: Exercise) => {
    const index = getValues('entries').findIndex((entry) => entry.exerciseId === exercise._id);
    if (index >= 0) {
      remove(index);
    } else {
      append(newEntry(exercise._id, lastSetsByExercise.get(exercise._id)?.length));
    }
  };

  const save = async (values: SessionFormValues, includeUnticked: boolean) => {
    setPendingValues(null);
    setFormError(null);

    const payload = toSessionPayload(values, metricOf, { includeUnticked });
    if (payload.entries.length === 0) {
      setFormError('Tick off at least one set before saving.');
      return;
    }

    try {
      if (sessionId) {
        const parsed = sessionUpdateSchema.safeParse(payload);
        if (!parsed.success) {
          setFormError(parsed.error.issues[0]?.message ?? 'Check the session details.');
          return;
        }
        await updateSession.mutateAsync({ id: sessionId, input: parsed.data });
      } else {
        const parsed = sessionInputSchema.safeParse({ ...payload, workout: workoutId });
        if (!parsed.success) {
          setFormError(parsed.error.issues[0]?.message ?? 'Check the session details.');
          return;
        }
        await createSession.mutateAsync(parsed.data);
      }
    } catch (error) {
      setFormError(getErrorMessage(error));
      return;
    }

    if (draftKey) clearDraft(draftKey);
    toast.success(sessionId ? 'Session updated' : 'Session saved');
    navigate('/history');
  };

  const onSubmit = (values: SessionFormValues) => {
    if (countSets(values.entries, metricOf).unticked > 0) {
      setPendingValues(values);
    } else {
      void save(values, false);
    }
  };

  const addExerciseButton = (
    <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
      <Plus aria-hidden="true" />
      Add exercise
    </Button>
  );

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto max-w-3xl space-y-6 pb-36 sm:pb-28"
    >
      <PageHeader title={title} description={description} />

      {showRestoredNotice && (
        <div
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm"
        >
          <span>Restored your unsaved session.</span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowRestoredNotice(false)}
            >
              Keep it
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={discardDraft}>
              Discard
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <FormField label="Date and time" htmlFor="performed-at">
            <Input id="performed-at" type="datetime-local" {...register('performedAt')} />
          </FormField>
          <FormField label="Duration in minutes (optional)" htmlFor="duration">
            <Input
              id="duration"
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 60"
              {...register('durationMinutes')}
            />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Notes (optional)" htmlFor="notes">
              <Textarea id="notes" rows={2} placeholder="How did it feel?" {...register('notes')} />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {fields.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No exercises yet"
          description="Add the exercises you are training today."
          action={addExerciseButton}
        />
      ) : (
        <>
          <ol className="space-y-4">
            {fields.map((field, index) => (
              <li key={field.id}>
                <ExerciseLog
                  index={index}
                  control={control}
                  register={register}
                  exercise={exerciseById.get(field.exerciseId)}
                  lastSets={lastSetsByExercise.get(field.exerciseId)}
                  onToggleSet={(setIndex) => toggleSet(index, setIndex)}
                  onRemove={() => remove(index)}
                />
              </li>
            ))}
          </ol>
          <div className="flex justify-center">{addExerciseButton}</div>
        </>
      )}

      {formError && <FormError message={formError} />}

      {restEndsAt !== null && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(7.5rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-4 sm:bottom-20">
          <RestTimer
            endsAt={restEndsAt}
            onAdjust={adjustRest}
            onDismiss={() => setRestEndsAt(null)}
          />
        </div>
      )}

      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background/95 backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{done}</span>{' '}
            {done === 1 ? 'set' : 'sets'} done
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(sessionId ? '/history' : '/dashboard')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : sessionId ? 'Save changes' : 'Save session'}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add exercises</DialogTitle>
            <DialogDescription>
              Tap exercises to add them to this session or remove them.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 overflow-y-auto p-1">
            <ExercisePicker
              exercises={exercises}
              selectedIds={exerciseIds}
              maxSelected={SESSION_MAX_ENTRIES}
              onToggle={toggleExercise}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingValues !== null}
        onOpenChange={(open) => {
          if (!open) setPendingValues(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Some sets are not ticked off</DialogTitle>
            <DialogDescription>
              {unticked === 1
                ? 'You filled in 1 set without ticking it off. Did you do it?'
                : `You filled in ${unticked} sets without ticking them off. Did you do them?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => pendingValues && save(pendingValues, false)}
            >
              Save ticked sets only
            </Button>
            <Button type="button" onClick={() => pendingValues && save(pendingValues, true)}>
              Mark as done and save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}

interface ExerciseLogProps {
  index: number;
  control: Control<SessionFormValues>;
  register: UseFormRegister<SessionFormValues>;
  exercise: Exercise | undefined;
  lastSets: SessionSet[] | undefined;
  onToggleSet: (setIndex: number) => void;
  onRemove: () => void;
}

// Sized for thumbs: 44px rows, and 16px text so phones do not zoom in on focus.
const setRow = 'grid grid-cols-[2rem_1fr_1fr_2.75rem] items-center gap-2';
const setInput = 'h-11 text-base sm:h-10 sm:text-sm';

function ExerciseLog({
  index,
  control,
  register,
  exercise,
  lastSets,
  onToggleSet,
  onRemove,
}: ExerciseLogProps) {
  const { fields, append, remove } = useFieldArray({ control, name: `entries.${index}.sets` });
  const sets = useWatch({ control, name: `entries.${index}.sets` });
  const metric = exercise?.metric ?? 'reps';
  const name = exercise ? formatExerciseName(exercise.name) : 'Unknown exercise';
  const targets = progressionTargets(lastSets, metric);
  const increase = describeIncrease(targets, metric);

  const addSet = () => {
    // New sets copy the previous row's numbers, since sets are usually repeated.
    const previous = sets.at(-1);
    append({
      reps: previous?.reps ?? '',
      weightKg: previous?.weightKg ?? '',
      durationSec: previous?.durationSec ?? '',
      completed: false,
    });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="min-w-0 space-y-1">
          <h2 className="truncate text-lg font-semibold">{name}</h2>
          <p className="text-sm text-muted-foreground">
            {lastSets && lastSets.length > 0
              ? `Last time: ${formatSets(lastSets, metric)}`
              : 'No previous sets logged'}
          </p>
          {increase && (
            <p className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
              <TrendingUp className="size-3.5" aria-hidden="true" />
              {increase}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="hover:text-red-400"
        >
          <Trash aria-hidden="true" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className={cn(setRow, 'text-xs font-medium text-muted-foreground')} aria-hidden="true">
          <span className="text-center">Set</span>
          {metric === 'time' ? (
            <span className="col-span-2">Seconds</span>
          ) : (
            <>
              <span>kg</span>
              <span>Reps</span>
            </>
          )}
          <span className="text-center">Done</span>
        </div>

        {fields.map((field, setIndex) => {
          const target = targetSet(targets, setIndex);
          const done = sets[setIndex]?.completed ?? false;
          const label = `set ${setIndex + 1} of ${name}`;

          return (
            <div
              key={field.id}
              className={cn(setRow, 'rounded-md py-1 transition-colors', done && 'bg-primary/10')}
            >
              <span className="text-center text-sm font-medium tabular-nums">{setIndex + 1}</span>
              {metric === 'time' ? (
                <Input
                  className={cn(setInput, 'col-span-2')}
                  inputMode="numeric"
                  autoComplete="off"
                  aria-label={`Seconds for ${label}`}
                  placeholder={target?.durationSec?.toString() ?? '–'}
                  {...register(`entries.${index}.sets.${setIndex}.durationSec`)}
                />
              ) : (
                <>
                  <Input
                    className={setInput}
                    inputMode="decimal"
                    autoComplete="off"
                    aria-label={`Weight in kg for ${label}`}
                    placeholder={target?.weightKg?.toString() ?? '–'}
                    {...register(`entries.${index}.sets.${setIndex}.weightKg`)}
                  />
                  <Input
                    className={setInput}
                    inputMode="numeric"
                    autoComplete="off"
                    aria-label={`Reps for ${label}`}
                    placeholder={target?.reps?.toString() ?? '–'}
                    {...register(`entries.${index}.sets.${setIndex}.reps`)}
                  />
                </>
              )}
              <Button
                type="button"
                size="icon"
                variant={done ? 'default' : 'outline'}
                aria-pressed={done}
                aria-label={`Complete ${label}`}
                onClick={() => onToggleSet(setIndex)}
                className="size-11 justify-self-center"
              >
                <Check aria-hidden="true" />
              </Button>
            </div>
          );
        })}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={addSet}>
            <Plus aria-hidden="true" />
            Add set
          </Button>
          {fields.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove(fields.length - 1)}
            >
              <Minus aria-hidden="true" />
              Remove last set
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
