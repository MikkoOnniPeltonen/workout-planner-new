import type { ExerciseMetric, SessionSet, WorkoutSession } from '@workout-planner/shared';
import { calendarDaysBetween, startOfWeek, toDateTimeLocalValue } from '@/lib/dates';
import { formatDate, formatNumber } from '@/lib/format';

type SetNumbers = Pick<SessionSet, 'reps' | 'weightKg' | 'durationSec'>;

export function formatSet(set: SetNumbers, metric: ExerciseMetric): string {
  if (metric === 'time') {
    return `${formatNumber(set.durationSec ?? 0)} s`;
  }
  if (set.weightKg) {
    return `${formatNumber(set.reps ?? 0)} × ${formatNumber(set.weightKg)} kg`;
  }
  return `${formatNumber(set.reps ?? 0)} reps`;
}

/** "3 sets of 8 × 60 kg" when every set matches, otherwise each set in order. */
export function formatSets(sets: SetNumbers[], metric: ExerciseMetric): string {
  const labels = sets.map((set) => formatSet(set, metric));
  if (labels.length > 1 && labels.every((label) => label === labels[0])) {
    return `${labels.length} sets of ${labels[0]}`;
  }
  return labels.join(', ');
}

export function sessionTotals(session: WorkoutSession) {
  let sets = 0;
  let volumeKg = 0;
  for (const entry of session.entries) {
    for (const set of entry.sets) {
      if (!set.completed) continue;
      sets += 1;
      volumeKg += (set.reps ?? 0) * (set.weightKg ?? 0);
    }
  }
  return { sets, volumeKg };
}

export interface SessionWeekGroup {
  /** Local date (YYYY-MM-DD) of the week's Monday. */
  key: string;
  label: string;
  sessions: WorkoutSession[];
}

/** Groups sessions (newest first) by the local week they were performed in. */
export function groupSessionsByWeek(
  sessions: WorkoutSession[],
  now = new Date(),
): SessionWeekGroup[] {
  const thisWeek = startOfWeek(now);
  const groups = new Map<string, SessionWeekGroup>();

  for (const session of sessions) {
    const weekStart = startOfWeek(new Date(session.performedAt));
    const key = toDateTimeLocalValue(weekStart).slice(0, 10);
    let group = groups.get(key);

    if (!group) {
      const weeksAgo = Math.round(calendarDaysBetween(weekStart, thisWeek) / 7);
      let label: string;
      if (weeksAgo === 0) {
        label = 'This week';
      } else if (weeksAgo === 1) {
        label = 'Last week';
      } else {
        const sameYear = weekStart.getFullYear() === now.getFullYear();
        label = `Week of ${formatDate(weekStart, {
          day: 'numeric',
          month: 'short',
          ...(sameYear ? {} : { year: 'numeric' }),
        })}`;
      }
      group = { key, label, sessions: [] };
      groups.set(key, group);
    }

    group.sessions.push(session);
  }

  return [...groups.values()];
}
