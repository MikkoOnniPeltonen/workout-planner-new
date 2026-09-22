import type { Workout } from '@workout-planner/shared';
import { motion } from 'framer-motion';
import { Dumbbell, Plus, Sparkles, Zap } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState, ErrorState, PageLoader } from '@/components/feedback';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { WorkoutCard } from '@/components/workouts/WorkoutCard';
import { WorkoutFormDialog } from '@/components/workouts/WorkoutFormDialog';
import { useAuth } from '@/context/auth.context';
import { useDeleteWorkout, useSessionStats, useWorkouts } from '@/hooks/queries';
import { getErrorMessage } from '@/lib/api';

type EditorState = { mode: 'create' } | { mode: 'edit'; workout: Workout } | null;

function UserPage() {
  const { user } = useAuth();
  const workoutsQuery = useWorkouts();
  // Only needed for "last done" dates; cards render fine before it loads.
  const statsQuery = useSessionStats();
  const deleteWorkout = useDeleteWorkout();
  const [editor, setEditor] = useState<EditorState>(null);
  const [pendingDelete, setPendingDelete] = useState<Workout | null>(null);

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteWorkout.mutate(pendingDelete._id, {
      onSuccess: () => {
        toast.success(`Deleted "${pendingDelete.name}"`);
        setPendingDelete(null);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };

  const actions = (
    <>
      <Button asChild variant="outline">
        <Link to="/create-workout">
          <Sparkles aria-hidden="true" />
          Generate a plan
        </Link>
      </Button>
      <Button onClick={() => setEditor({ mode: 'create' })}>
        <Plus aria-hidden="true" />
        New workout
      </Button>
    </>
  );

  const quickStartAction = (
    <Button asChild>
      <Link to="/create-workout?quick=1">
        <Zap aria-hidden="true" />
        Quick start
      </Link>
    </Button>
  );

  let content: ReactNode;
  if (workoutsQuery.isPending) {
    content = <PageLoader label="Loading your workouts…" />;
  } else if (workoutsQuery.isError) {
    content = (
      <ErrorState
        message={getErrorMessage(workoutsQuery.error)}
        onRetry={() => workoutsQuery.refetch()}
      />
    );
  } else if (workoutsQuery.data.length === 0) {
    content = (
      <EmptyState
        icon={Dumbbell}
        title="No workouts yet"
        description="Generate a plan in a few taps, or build one yourself from the exercise library."
        action={
          <>
            {quickStartAction}
            {actions}
          </>
        }
      />
    );
  } else {
    content = (
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workoutsQuery.data.map((workout) => (
          <motion.li
            key={workout._id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <WorkoutCard
              workout={workout}
              lastPerformedAt={statsQuery.data?.lastPerformedByWorkout[workout._id]}
              onEdit={() => setEditor({ mode: 'edit', workout })}
              onDelete={() => setPendingDelete(workout)}
            />
          </motion.li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="My workouts"
        description={
          user ? `Welcome back, ${user.name}. Plan, adjust and track your training.` : undefined
        }
        actions={actions}
      />

      {content}

      <WorkoutFormDialog
        open={editor !== null}
        workout={editor?.mode === 'edit' ? editor.workout : undefined}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete workout?"
        description={`"${pendingDelete?.name ?? ''}" will be deleted. Sessions you logged with it stay in your history.`}
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        pending={deleteWorkout.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default UserPage;
