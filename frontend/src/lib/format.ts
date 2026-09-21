import { calendarDaysBetween } from '@/lib/dates';

/** Exercise names are stored in lowercase; display them in title case. */
export function formatExerciseName(name: string): string {
  return name.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

export function formatDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
): string {
  return new Intl.DateTimeFormat(undefined, options).format(new Date(value));
}

const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

/** "today", "yesterday", "5 days ago", "3 weeks ago", and a plain date after that. */
export function formatDaysAgo(value: string | Date, now = new Date()): string {
  const days = calendarDaysBetween(new Date(value), now);
  if (days < 0 || days > 8 * 7) {
    return formatDate(value);
  }
  if (days < 14) {
    return relativeTime.format(days === 0 ? 0 : -days, 'day');
  }
  return relativeTime.format(-Math.floor(days / 7), 'week');
}

/** A week key (YYYY-MM-DD of its Monday) as a short label such as "7 Sep". */
export function formatWeekLabel(weekStart: string): string {
  const [year, month, day] = weekStart.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(
    new Date(year, month - 1, day),
  );
}

const plainNumber = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const compactNumber = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatNumber(value: number, { compact = false } = {}): string {
  return (compact ? compactNumber : plainNumber).format(value);
}
