import { Search } from 'lucide-react';
import type * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function SearchInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input type="search" className="pl-9" {...props} />
    </div>
  );
}
