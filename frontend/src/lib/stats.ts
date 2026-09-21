import { formatNumber } from '@/lib/format';

export type DeltaDirection = 'up' | 'down' | 'flat';

export interface Delta {
  /** Signed, e.g. "+3", "−12%" or "±0". */
  label: string;
  direction: DeltaDirection;
}

function signOf(value: number) {
  if (value > 0) return '+';
  if (value < 0) return '−';
  return '±';
}

function directionOf(value: number): DeltaDirection {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'flat';
}

export function countDelta(current: number, previous: number): Delta {
  const difference = current - previous;
  return {
    label: `${signOf(difference)}${formatNumber(Math.abs(difference))}`,
    direction: directionOf(difference),
  };
}

/** Percentage change, or undefined when there is no previous value to compare with. */
export function percentDelta(current: number, previous: number): Delta | undefined {
  if (previous === 0) return undefined;
  const percent = Math.round(((current - previous) / previous) * 100);
  return { label: `${signOf(percent)}${Math.abs(percent)}%`, direction: directionOf(percent) };
}
