import { LoaderCircle, type LucideIcon, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <output
      aria-live="polite"
      className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground"
    >
      <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </output>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center">
      <Icon className="size-10 text-muted-foreground" aria-hidden="true" />
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="max-w-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-12 text-center"
    >
      <TriangleAlert className="size-8 text-red-400" aria-hidden="true" />
      <p className="font-medium">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
