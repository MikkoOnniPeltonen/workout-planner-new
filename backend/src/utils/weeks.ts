const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Local calendar date (YYYY-MM-DD) of the Monday that starts the week containing `date`. */
export function weekStartKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? '';

  const daysSinceMonday = WEEKDAYS.indexOf(part('weekday'));
  const monday = new Date(
    Date.UTC(
      Number(part('year')),
      Number(part('month')) - 1,
      Number(part('day')) - daysSinceMonday,
    ),
  );
  return monday.toISOString().slice(0, 10);
}

/** Shifts a week key by whole weeks. Pure calendar arithmetic, so time zones do not matter. */
export function addWeeks(weekKey: string, weeks: number): string {
  const date = new Date(`${weekKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + weeks * 7);
  return date.toISOString().slice(0, 10);
}

/**
 * Consecutive weeks with at least one session, counting back from the current week. An empty
 * current week does not break the streak, so it survives until the week is over.
 */
export function weekStreak(activeWeeks: Set<string>, currentWeek: string): number {
  let week = activeWeeks.has(currentWeek) ? currentWeek : addWeeks(currentWeek, -1);
  let streak = 0;
  while (activeWeeks.has(week)) {
    streak += 1;
    week = addWeeks(week, -1);
  }
  return streak;
}
