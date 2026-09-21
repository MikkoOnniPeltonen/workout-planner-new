import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Delta } from '@/lib/stats';
import { cn } from '@/lib/utils';

// More is better for every stat shown, so "up" is good. The arrow and sign carry the meaning; color only reinforces it.
const deltaStyles = {
  up: { icon: ArrowUp, className: 'text-primary' },
  down: { icon: ArrowDown, className: 'text-red-400' },
  flat: { icon: Minus, className: 'text-muted-foreground' },
};

interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  delta?: Delta;
  /** Names the period the delta compares against, e.g. "vs previous 12 weeks". */
  comparison?: string;
  /** Shown instead of a delta. */
  note?: string;
}

export function StatTile({ label, value, unit, delta, comparison, note }: StatTileProps) {
  const style = delta ? deltaStyles[delta.direction] : null;

  return (
    <Card>
      <CardContent className="space-y-1 p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight">
          {value}
          {unit && <span className="ml-1 text-base font-medium text-muted-foreground">{unit}</span>}
        </p>
        {delta && style ? (
          <p className="flex flex-wrap items-center gap-x-1 text-xs">
            <span className={cn('inline-flex items-center gap-0.5 font-medium', style.className)}>
              <style.icon className="size-3.5" aria-hidden="true" />
              {delta.label}
            </span>
            {comparison && <span className="text-muted-foreground">{comparison}</span>}
          </p>
        ) : (
          note && <p className="text-xs text-muted-foreground">{note}</p>
        )}
      </CardContent>
    </Card>
  );
}
