import type * as React from 'react';
import { cn } from '@/lib/utils';

interface FilterChipProps extends React.ComponentProps<'button'> {
  active: boolean;
}

export function FilterChip({ active, className, ...props }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
        className,
      )}
      {...props}
    />
  );
}
