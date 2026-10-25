import type { MuscleGroupSets } from '@workout-planner/shared';
import { useReducedMotion } from 'framer-motion';
import { ChartColumn, Download } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { chartTheme } from '@/components/charts/chart-theme';
import { EmptyState, ErrorState, PageLoader } from '@/components/feedback';
import { PageHeader } from '@/components/PageHeader';
import { StatTile } from '@/components/StatTile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { FilterChip } from '@/components/ui/filter-chip';
import { useSessionStats } from '@/hooks/queries';
import { getErrorMessage } from '@/lib/api';
import { downloadSessionExport } from '@/lib/export';
import {
  formatDate,
  formatDaysAgo,
  formatExerciseName,
  formatNumber,
  formatWeekLabel,
} from '@/lib/format';
import { countDelta, percentDelta } from '@/lib/stats';
import { cn } from '@/lib/utils';

const ranges = [
  { weeks: 4, label: '4 weeks' },
  { weeks: 12, label: '12 weeks' },
  { weeks: 26, label: '6 months' },
];

const axisTick = { fill: chartTheme.mutedText, fontSize: 12 };
const MUSCLE_GROUP_ROW_HEIGHT = 36;

interface ChartCardProps {
  title: string;
  description: ReactNode;
  children: ReactNode;
  /** Table twin of the chart, so no value is only reachable by hovering. */
  table?: ReactNode;
}

function ChartCard({ title, description, children, table }: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold leading-none tracking-tight">{title}</h2>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
        {table && (
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Show as table
            </summary>
            <div className="mt-3 overflow-x-auto">{table}</div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-muted-foreground">
          {columns.map((column, index) => (
            <th
              key={column}
              scope="col"
              className={cn('py-2 pr-4 font-medium', index === 0 ? 'text-left' : 'text-right')}
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={String(row[0])} className="border-b border-border/60 last:border-0">
            {row.map((cell, index) =>
              index === 0 ? (
                <th key={columns[index]} scope="row" className="py-2 pr-4 text-left font-medium">
                  {cell}
                </th>
              ) : (
                <td key={columns[index]} className="py-2 pr-4 text-right tabular-nums">
                  {cell}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StatisticsPage() {
  const reducedMotion = useReducedMotion();
  const [weeks, setWeeks] = useState(12);
  const [isExporting, setIsExporting] = useState(false);
  const statsQuery = useSessionStats(weeks);
  const rangeLabel = ranges.find((range) => range.weeks === weeks)?.label ?? `${weeks} weeks`;

  const exportData = async () => {
    setIsExporting(true);
    try {
      await downloadSessionExport();
      toast.success('Training history exported');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsExporting(false);
    }
  };

  const header = (
    <PageHeader
      title="Your progress"
      description="Real numbers from the sessions you have logged."
      actions={
        <Button variant="outline" onClick={exportData} disabled={isExporting}>
          <Download aria-hidden="true" />
          {isExporting ? 'Exporting…' : 'Export data'}
        </Button>
      }
    />
  );

  if (statsQuery.isPending) {
    return (
      <div className="space-y-6">
        {header}
        <PageLoader label="Crunching your numbers…" />
      </div>
    );
  }

  if (statsQuery.isError) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState
          message={getErrorMessage(statsQuery.error)}
          onRetry={() => statsQuery.refetch()}
        />
      </div>
    );
  }

  const stats = statsQuery.data;

  if (stats.totalSessions === 0) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          icon={ChartColumn}
          title="No sessions logged yet"
          description="Log your first workout and your weekly activity, volume and personal records will show up here."
          action={
            <>
              <Button asChild variant="outline">
                <Link to="/dashboard">Go to workouts</Link>
              </Button>
              <Button asChild>
                <Link to="/log">Log a session</Link>
              </Button>
            </>
          }
        />
      </div>
    );
  }

  const { totals, previousTotals, weekly, setsPerMuscleGroup, personalRecords } = stats;
  const thisWeek = weekly.at(-1);
  const comparison = `vs previous ${rangeLabel}`;
  const volumeDelta = percentDelta(totals.volumeKg, previousTotals.volumeKg);

  const lastTrained = (datum: unknown) => {
    const date = stats.lastTrainedByMuscleGroup[(datum as MuscleGroupSets).muscleGroup];
    return date ? `Last trained ${formatDaysAgo(date)}` : undefined;
  };

  return (
    <div className="space-y-6">
      {header}

      {/* One filter row; it scopes everything below except all-time records and the streak. */}
      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className="sr-only">Time range</legend>
        {ranges.map((range) => (
          <FilterChip
            key={range.weeks}
            active={range.weeks === weeks}
            onClick={() => setWeeks(range.weeks)}
          >
            {range.label}
          </FilterChip>
        ))}
      </fieldset>

      {/* While a new range loads, keep showing the previous numbers, dimmed. */}
      <div
        aria-busy={statsQuery.isFetching}
        className={cn('space-y-6 transition-opacity', statsQuery.isPlaceholderData && 'opacity-60')}
      >
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile
            label="Sessions"
            value={formatNumber(totals.sessions)}
            delta={countDelta(totals.sessions, previousTotals.sessions)}
            comparison={comparison}
          />
          <StatTile
            label="Completed sets"
            value={formatNumber(totals.sets)}
            delta={countDelta(totals.sets, previousTotals.sets)}
            comparison={comparison}
          />
          <StatTile
            label="Volume"
            value={formatNumber(totals.volumeKg, { compact: true })}
            unit="kg"
            delta={volumeDelta}
            comparison={comparison}
            note="Nothing earlier to compare with"
          />
          <StatTile
            label="Week streak"
            value={formatNumber(stats.currentWeekStreak)}
            unit={stats.currentWeekStreak === 1 ? 'week' : 'weeks'}
            note="in a row with at least one session"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Sessions per week"
            description={`This week: ${thisWeek?.sessions ?? 0}`}
            table={
              <DataTable
                columns={['Week of', 'Sessions', 'Sets']}
                rows={weekly.map((week) => [
                  formatWeekLabel(week.weekStart),
                  week.sessions,
                  week.sets,
                ])}
              />
            }
          >
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weekly}
                  margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                  accessibilityLayer
                >
                  <CartesianGrid vertical={false} stroke={chartTheme.grid} />
                  <XAxis
                    dataKey="weekStart"
                    tickFormatter={formatWeekLabel}
                    tick={axisTick}
                    tickLine={false}
                    axisLine={{ stroke: chartTheme.baseline }}
                    minTickGap={12}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                  />
                  <Tooltip
                    cursor={{ fill: chartTheme.hover }}
                    content={
                      <ChartTooltip
                        formatLabel={(label) => `Week of ${formatWeekLabel(label)}`}
                        formatValue={(value) => `${value} ${value === 1 ? 'session' : 'sessions'}`}
                      />
                    }
                  />
                  <Bar
                    isAnimationActive={!reducedMotion}
                    dataKey="sessions"
                    fill={chartTheme.series}
                    activeBar={{ fill: chartTheme.seriesActive }}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard
            title="Training volume"
            description={`Weight × reps each week. This week: ${formatNumber(thisWeek?.volumeKg ?? 0)} kg`}
            table={
              <DataTable
                columns={['Week of', 'Volume (kg)']}
                rows={weekly.map((week) => [
                  formatWeekLabel(week.weekStart),
                  formatNumber(week.volumeKg),
                ])}
              />
            }
          >
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weekly}
                  margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                  accessibilityLayer
                >
                  <CartesianGrid vertical={false} stroke={chartTheme.grid} />
                  <XAxis
                    dataKey="weekStart"
                    tickFormatter={formatWeekLabel}
                    tick={axisTick}
                    tickLine={false}
                    axisLine={{ stroke: chartTheme.baseline }}
                    minTickGap={12}
                  />
                  <YAxis
                    tickFormatter={(value: number) => formatNumber(value, { compact: true })}
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ stroke: chartTheme.baseline, strokeWidth: 1 }}
                    content={
                      <ChartTooltip
                        formatLabel={(label) => `Week of ${formatWeekLabel(label)}`}
                        formatValue={(value) => `${formatNumber(value)} kg`}
                      />
                    }
                  />
                  <Area
                    isAnimationActive={!reducedMotion}
                    type="linear"
                    dataKey="volumeKg"
                    stroke={chartTheme.series}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={chartTheme.series}
                    fillOpacity={0.1}
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: chartTheme.series,
                      stroke: chartTheme.surface,
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard
            title="Sets per muscle group"
            description={`Completed sets in the last ${rangeLabel}. A set counts for every muscle group its exercise trains.`}
            table={
              setsPerMuscleGroup.length > 0 && (
                <DataTable
                  columns={['Muscle group', 'Sets', 'Last trained']}
                  rows={setsPerMuscleGroup.map((row) => {
                    const date = stats.lastTrainedByMuscleGroup[row.muscleGroup];
                    return [row.muscleGroup, row.sets, date ? formatDaysAgo(date) : '–'];
                  })}
                />
              )
            }
          >
            {setsPerMuscleGroup.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No sets logged in this period.
              </p>
            ) : (
              <div style={{ height: setsPerMuscleGroup.length * MUSCLE_GROUP_ROW_HEIGHT + 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={setsPerMuscleGroup}
                    margin={{ top: 0, right: 36, bottom: 0, left: 0 }}
                    accessibilityLayer
                  >
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="muscleGroup"
                      width={88}
                      tick={{ fill: chartTheme.secondaryText, fontSize: 13 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: chartTheme.hover }}
                      content={
                        <ChartTooltip
                          formatValue={(value) => `${value} ${value === 1 ? 'set' : 'sets'}`}
                          detail={lastTrained}
                        />
                      }
                    />
                    <Bar
                      isAnimationActive={!reducedMotion}
                      dataKey="sets"
                      fill={chartTheme.series}
                      activeBar={{ fill: chartTheme.seriesActive }}
                      radius={[0, 4, 4, 0]}
                      maxBarSize={24}
                    >
                      <LabelList
                        dataKey="sets"
                        position="right"
                        fill={chartTheme.secondaryText}
                        fontSize={12}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="Personal records"
            description="Best estimated one-rep max per exercise, all time. Uses the Epley formula on sets of up to 12 reps."
          >
            {personalRecords.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Log weighted sets to start tracking records.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th scope="col" className="py-2 pr-4 text-left font-medium">
                        Exercise
                      </th>
                      <th scope="col" className="py-2 pr-4 text-right font-medium">
                        Best set
                      </th>
                      <th scope="col" className="py-2 pr-4 text-right font-medium">
                        Est. 1RM
                      </th>
                      <th scope="col" className="py-2 text-right font-medium">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {personalRecords.slice(0, 10).map((record) => (
                      <tr key={record.exercise} className="border-b border-border/60 last:border-0">
                        <th scope="row" className="py-2 pr-4 text-left font-medium">
                          {formatExerciseName(record.exerciseName)}
                        </th>
                        <td className="py-2 pr-4 text-right tabular-nums">
                          {record.reps} × {formatNumber(record.weightKg)} kg
                        </td>
                        <td className="py-2 pr-4 text-right font-semibold tabular-nums">
                          {formatNumber(record.bestE1rmKg)} kg
                        </td>
                        <td className="py-2 text-right text-muted-foreground">
                          {formatDate(record.performedAt, { day: 'numeric', month: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

export default StatisticsPage;
