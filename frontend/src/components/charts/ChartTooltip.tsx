import { chartTheme } from '@/components/charts/chart-theme';

interface ChartTooltipProps {
  // Injected by Recharts.
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{ value?: unknown; payload?: unknown }>;
  // Supplied by the chart.
  formatValue: (value: number) => string;
  formatLabel?: (label: string) => string;
  /** Optional extra line derived from the hovered data point. */
  detail?: (datum: unknown) => string | undefined;
}

/** Single-series tooltip: the value leads, the label follows. */
export function ChartTooltip({
  active,
  label,
  payload,
  formatValue,
  formatLabel,
  detail,
}: ChartTooltipProps) {
  const item = payload?.[0];
  if (!active || !item || typeof item.value !== 'number') {
    return null;
  }

  const heading = formatLabel ? formatLabel(String(label)) : String(label ?? '');
  const extra = detail?.(item.payload);

  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-lg">
      <p className="flex items-center gap-2 font-semibold text-foreground">
        <span
          aria-hidden="true"
          className="h-0.5 w-3 rounded-full"
          style={{ backgroundColor: chartTheme.series }}
        />
        {formatValue(item.value)}
      </p>
      {heading && <p className="text-xs text-muted-foreground">{heading}</p>}
      {extra && <p className="text-xs text-muted-foreground">{extra}</p>}
    </div>
  );
}
