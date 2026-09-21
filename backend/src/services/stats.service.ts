import type { PeriodTotals, SessionStats } from '@workout-planner/shared';
import { Types } from 'mongoose';
import { Exercise } from '../models/Exercise.model.ts';
import { MuscleGroup } from '../models/MuscleGroup.model.ts';
import { WorkoutSession } from '../models/WorkoutSession.model.ts';
import { addWeeks, weekStartKey, weekStreak } from '../utils/weeks.ts';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
// Estimated one-rep maxes get unreliable beyond this many reps.
const MAX_RECORD_REPS = 12;

interface StatsOptions {
  weeks: number;
  timeZone: string;
  now?: Date;
}

interface WeekRow {
  _id: string;
  sessions: number;
  sets: number;
  volumeKg: number;
}

/** Local date (YYYY-MM-DD) of the Monday starting the week a session was performed in. */
function weekKey(timeZone: string) {
  return {
    $dateToString: {
      format: '%Y-%m-%d',
      timezone: timeZone,
      date: {
        $dateTrunc: {
          date: '$performedAt',
          unit: 'week',
          timezone: timeZone,
          startOfWeek: 'monday',
        },
      },
    },
  };
}

/** Only completed sets count. Sets saved without the flag are treated as completed. */
function completedSets(entry: string) {
  return {
    $filter: { input: `${entry}.sets`, as: 'set', cond: { $ne: ['$$set.completed', false] } },
  };
}

function roundToHalf(value: number) {
  return Math.round(value * 2) / 2;
}

/** Sums weekly rows whose week key falls within [firstWeek, lastWeek]. */
function sumWeeks(rows: WeekRow[], firstWeek: string, lastWeek: string): PeriodTotals {
  const totals = { sessions: 0, sets: 0, volumeKg: 0 };
  for (const row of rows) {
    if (row._id >= firstWeek && row._id <= lastWeek) {
      totals.sessions += row.sessions;
      totals.sets += row.sets;
      totals.volumeKg += row.volumeKg;
    }
  }
  return { ...totals, volumeKg: Math.round(totals.volumeKg) };
}

/** Joins each session entry to its exercise's muscle groups, one document per group. */
const unwindEntryMuscleGroups = [
  {
    $lookup: {
      from: Exercise.collection.name,
      localField: 'entries.exercise',
      foreignField: '_id',
      as: 'exercise',
    },
  },
  { $unwind: '$exercise' },
  { $unwind: '$exercise.belongsTo' },
  {
    $lookup: {
      from: MuscleGroup.collection.name,
      localField: 'exercise.belongsTo',
      foreignField: '_id',
      as: 'group',
    },
  },
  { $unwind: '$group' },
];

class StatsService {
  async getStats(
    userId: string,
    { weeks, timeZone, now = new Date() }: StatsOptions,
  ): Promise<SessionStats> {
    const owner = new Types.ObjectId(userId);
    const currentWeek = weekStartKey(now, timeZone);
    const firstWeek = addWeeks(currentWeek, 1 - weeks);
    // A generous lower bound lets the index narrow the scan; exact filtering is by week key.
    const windowStart = new Date(now.getTime() - (weeks + 1) * WEEK_MS);

    const [weeklyRows, muscleGroupRows, recordRows, workoutRows, muscleGroupRecencyRows] =
      await Promise.all([
        this.weeklyTotals(owner, timeZone),
        this.setsPerMuscleGroup(owner, timeZone, firstWeek, windowStart),
        this.personalRecords(owner),
        this.lastPerformedByWorkout(owner),
        this.lastTrainedByMuscleGroup(owner),
      ]);

    const rowsByWeek = new Map(weeklyRows.map((row) => [row._id, row]));
    const weekly = Array.from({ length: weeks }, (_, index) => {
      const weekStart = addWeeks(firstWeek, index);
      const row = rowsByWeek.get(weekStart);
      return {
        weekStart,
        sessions: row?.sessions ?? 0,
        sets: row?.sets ?? 0,
        volumeKg: Math.round(row?.volumeKg ?? 0),
      };
    });

    return {
      weekly,
      totals: sumWeeks(weeklyRows, firstWeek, currentWeek),
      previousTotals: sumWeeks(weeklyRows, addWeeks(firstWeek, -weeks), addWeeks(firstWeek, -1)),
      totalSessions: weeklyRows.reduce((total, row) => total + row.sessions, 0),
      currentWeekStreak: weekStreak(new Set(rowsByWeek.keys()), currentWeek),
      setsPerMuscleGroup: muscleGroupRows.map((row) => ({ muscleGroup: row._id, sets: row.sets })),
      personalRecords: recordRows.map((row) => ({
        ...row,
        bestE1rmKg: roundToHalf(row.bestE1rmKg),
        performedAt: row.performedAt.toISOString(),
      })),
      lastPerformedByWorkout: Object.fromEntries(
        workoutRows.map((row) => [String(row._id), row.lastPerformedAt.toISOString()]),
      ),
      lastTrainedByMuscleGroup: Object.fromEntries(
        muscleGroupRecencyRows.map((row) => [row._id, row.lastTrainedAt.toISOString()]),
      ),
    };
  }

  /** Sessions, completed sets and volume per week (all time, so streaks can be counted). */
  private weeklyTotals(owner: Types.ObjectId, timeZone: string) {
    return WorkoutSession.aggregate<WeekRow>([
      { $match: { belongsTo: owner } },
      {
        $project: {
          week: weekKey(timeZone),
          setsPerEntry: { $map: { input: '$entries', as: 'entry', in: completedSets('$$entry') } },
        },
      },
      {
        $project: {
          week: 1,
          sets: { $sum: { $map: { input: '$setsPerEntry', as: 'sets', in: { $size: '$$sets' } } } },
          volumeKg: {
            $sum: {
              $map: {
                input: '$setsPerEntry',
                as: 'sets',
                in: {
                  $sum: {
                    $map: {
                      input: '$$sets',
                      as: 'set',
                      in: {
                        $multiply: [
                          { $ifNull: ['$$set.reps', 0] },
                          { $ifNull: ['$$set.weightKg', 0] },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: '$week',
          sessions: { $sum: 1 },
          sets: { $sum: '$sets' },
          volumeKg: { $sum: '$volumeKg' },
        },
      },
    ]);
  }

  /** A set counts towards every muscle group its exercise trains. */
  private setsPerMuscleGroup(
    owner: Types.ObjectId,
    timeZone: string,
    firstWeek: string,
    windowStart: Date,
  ) {
    return WorkoutSession.aggregate<{ _id: string; sets: number }>([
      { $match: { belongsTo: owner, performedAt: { $gte: windowStart } } },
      { $addFields: { week: weekKey(timeZone) } },
      { $match: { week: { $gte: firstWeek } } },
      { $unwind: '$entries' },
      { $addFields: { completedSetCount: { $size: completedSets('$entries') } } },
      { $match: { completedSetCount: { $gt: 0 } } },
      ...unwindEntryMuscleGroups,
      { $group: { _id: '$group.name', sets: { $sum: '$completedSetCount' } } },
      { $sort: { sets: -1, _id: 1 } },
    ]);
  }

  /** Best estimated one-rep max per exercise, using the Epley formula. */
  private personalRecords(owner: Types.ObjectId) {
    return WorkoutSession.aggregate<{
      exercise: string;
      exerciseName: string;
      bestE1rmKg: number;
      weightKg: number;
      reps: number;
      performedAt: Date;
    }>([
      { $match: { belongsTo: owner } },
      { $unwind: '$entries' },
      { $unwind: '$entries.sets' },
      {
        $match: {
          'entries.sets.completed': { $ne: false },
          'entries.sets.weightKg': { $gt: 0 },
          'entries.sets.reps': { $gte: 1, $lte: MAX_RECORD_REPS },
        },
      },
      {
        $project: {
          exercise: '$entries.exercise',
          performedAt: 1,
          weightKg: '$entries.sets.weightKg',
          reps: '$entries.sets.reps',
          e1rm: {
            $cond: [
              { $eq: ['$entries.sets.reps', 1] },
              '$entries.sets.weightKg',
              {
                $multiply: [
                  '$entries.sets.weightKg',
                  { $add: [1, { $divide: ['$entries.sets.reps', 30] }] },
                ],
              },
            ],
          },
        },
      },
      { $sort: { e1rm: -1, performedAt: 1 } },
      {
        $group: {
          _id: '$exercise',
          bestE1rmKg: { $first: '$e1rm' },
          weightKg: { $first: '$weightKg' },
          reps: { $first: '$reps' },
          performedAt: { $first: '$performedAt' },
        },
      },
      {
        $lookup: {
          from: Exercise.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'exercise',
        },
      },
      { $unwind: '$exercise' },
      {
        $project: {
          _id: 0,
          exercise: { $toString: '$_id' },
          exerciseName: '$exercise.name',
          bestE1rmKg: 1,
          weightKg: 1,
          reps: 1,
          performedAt: 1,
        },
      },
      { $sort: { bestE1rmKg: -1 } },
    ]);
  }

  private lastPerformedByWorkout(owner: Types.ObjectId) {
    return WorkoutSession.aggregate<{ _id: Types.ObjectId; lastPerformedAt: Date }>([
      { $match: { belongsTo: owner, workout: { $ne: null } } },
      { $group: { _id: '$workout', lastPerformedAt: { $max: '$performedAt' } } },
    ]);
  }

  private lastTrainedByMuscleGroup(owner: Types.ObjectId) {
    return WorkoutSession.aggregate<{ _id: string; lastTrainedAt: Date }>([
      { $match: { belongsTo: owner } },
      { $unwind: '$entries' },
      ...unwindEntryMuscleGroups,
      { $group: { _id: '$group.name', lastTrainedAt: { $max: '$performedAt' } } },
    ]);
  }
}

export const statsService = new StatsService();
