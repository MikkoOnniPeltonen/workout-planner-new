import type { WorkoutSession } from '@workout-planner/shared';
import { RotateCcwClock as HistoryIcon, Pencil, Plus, Trash } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState, ErrorState, PageLoader } from '@/components/feedback';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useDeleteSession, useSessionHistory } from '@/hooks/queries';
import { getErrorMessage } from '@/lib/api';
import { formatDate, formatExerciseName, formatNumber } from '@/lib/format';
import { formatSets, groupSessionsByWeek, sessionTotals } from '@/lib/sessions';

function SessionCard({ session, onDelete }: { session: WorkoutSession; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { sets, volumeKg } = sessionTotals(session);
  const detailsId = `session-${session._id}-sets`;
  const when = formatDate(session.performedAt, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
  const summary = [
    `${session.entries.length} ${session.entries.length === 1 ? 'exercise' : 'exercises'}`,
    `${sets} ${sets === 1 ? 'set' : 'sets'}`,
    volumeKg > 0 ? `${formatNumber(volumeKg)} kg` : null,
    session.durationMinutes ? `${session.durationMinutes} min` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="min-w-0 space-y-1">
          <h3 className="truncate font-semibold">{session.workoutName}</h3>
          <p className="text-sm text-muted-foreground">{when}</p>
          <p className="text-sm text-muted-foreground">{summary}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button asChild variant="ghost" size="icon">
            <Link
              to={`/sessions/${session._id}/edit`}
              aria-label={`Edit ${session.workoutName}, ${when}`}
            >
              <Pencil aria-hidden="true" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label={`Delete ${session.workoutName}, ${when}`}
            className="hover:text-red-400"
          >
            <Trash aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="link"
          size="sm"
          className="h-auto px-0"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Hide sets' : 'Show sets'}
        </Button>
        <ul id={detailsId} hidden={!expanded} className="space-y-2">
          {session.entries.map((entry) => (
            <li
              key={entry.exercise._id}
              className="flex flex-col gap-0.5 text-sm sm:flex-row sm:justify-between sm:gap-4"
            >
              <span className="font-medium">{formatExerciseName(entry.exercise.name)}</span>
              <span className="text-muted-foreground">
                {formatSets(entry.sets, entry.exercise.metric)}
              </span>
            </li>
          ))}
        </ul>
        {session.notes && <p className="text-sm text-muted-foreground italic">“{session.notes}”</p>}
      </CardContent>
    </Card>
  );
}

function HistoryPage() {
  const history = useSessionHistory();
  const deleteSession = useDeleteSession();
  const [pendingDelete, setPendingDelete] = useState<WorkoutSession | null>(null);

  const logButton = (
    <Button asChild>
      <Link to="/log">
        <Plus aria-hidden="true" />
        Log freestyle session
      </Link>
    </Button>
  );

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteSession.mutate(pendingDelete._id, {
      onSuccess: () => {
        toast.success('Session deleted');
        setPendingDelete(null);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };

  let content: ReactNode;
  if (history.isPending) {
    content = <PageLoader label="Loading your history…" />;
  } else if (history.isError) {
    content = (
      <ErrorState message={getErrorMessage(history.error)} onRetry={() => history.refetch()} />
    );
  } else {
    const sessions = history.data.pages.flat();
    content =
      sessions.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="No sessions logged yet"
          description="Start a workout from your workouts page, or log a freestyle session."
          action={
            <>
              <Button asChild variant="outline">
                <Link to="/dashboard">Go to workouts</Link>
              </Button>
              {logButton}
            </>
          }
        />
      ) : (
        <div className="space-y-8">
          {groupSessionsByWeek(sessions).map((group) => (
            <section key={group.key} aria-labelledby={`week-${group.key}`} className="space-y-3">
              <h2
                id={`week-${group.key}`}
                className="text-sm font-medium tracking-wide text-muted-foreground uppercase"
              >
                {group.label}
              </h2>
              <ul className="space-y-3">
                {group.sessions.map((session) => (
                  <li key={session._id}>
                    <SessionCard session={session} onDelete={() => setPendingDelete(session)} />
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {history.hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => history.fetchNextPage()}
                disabled={history.isFetchingNextPage}
              >
                {history.isFetchingNextPage ? 'Loading…' : 'Load older sessions'}
              </Button>
            </div>
          )}
        </div>
      );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="History"
        description="Every session you have logged."
        actions={logButton}
      />
      {content}
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete session?"
        description={`Your ${pendingDelete?.workoutName ?? ''} session and its sets will be permanently deleted.`}
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        pending={deleteSession.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default HistoryPage;
