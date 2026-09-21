import { Timer } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNow } from '@/hooks/useNow';
import { cn } from '@/lib/utils';

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

interface RestTimerProps {
  /** Epoch milliseconds when the rest period ends. */
  endsAt: number;
  onAdjust: (seconds: number) => void;
  onDismiss: () => void;
}

export function RestTimer({ endsAt, onAdjust, onDismiss }: RestTimerProps) {
  // Remaining time is derived from the clock, so it stays right when the tab is throttled.
  const now = useNow(250);
  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const finished = remaining === 0;

  useEffect(() => {
    if (finished) {
      navigator.vibrate?.([200, 100, 200]);
    }
  }, [finished]);

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-1 rounded-full border py-1 pr-1 pl-3 text-sm shadow-lg',
        finished ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card',
      )}
    >
      <Timer className="size-4" aria-hidden="true" />
      <span className="px-1 font-medium">{finished ? 'Rest over' : 'Rest'}</span>
      {!finished && (
        <span className="w-10 font-semibold tabular-nums">{formatClock(remaining)}</span>
      )}
      {/* Announce only the end of the rest, not every second. */}
      <span className="sr-only" aria-live="assertive">
        {finished ? 'Rest is over. Time for the next set.' : ''}
      </span>
      {!finished && (
        <>
          <Button type="button" variant="ghost" size="sm" onClick={() => onAdjust(-15)}>
            −15 s
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onAdjust(15)}>
            +15 s
          </Button>
        </>
      )}
      <Button
        type="button"
        variant={finished ? 'secondary' : 'ghost'}
        size="sm"
        onClick={onDismiss}
      >
        {finished ? 'Dismiss' : 'Skip'}
      </Button>
    </div>
  );
}
