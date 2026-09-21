import type { SessionInput, SessionSet, SessionUpdateInput } from '@workout-planner/shared';
import { Types } from 'mongoose';
import { Workout } from '../models/Workout.model.ts';
import { WorkoutSession } from '../models/WorkoutSession.model.ts';
import { HttpError } from '../utils/http-error.ts';
import { exerciseService } from './exercise.service.ts';

const FREESTYLE_NAME = 'Freestyle session';

const populateEntries = { path: 'entries.exercise', populate: { path: 'belongsTo' } };

interface ListOptions {
  limit: number;
  /** ISO date; only sessions performed before it are returned (for paging). */
  before?: string;
}

// Every query is scoped to the owner, like workouts.
class SessionService {
  async listSessions(userId: string, { limit, before }: ListOptions) {
    return WorkoutSession.find({
      belongsTo: userId,
      ...(before ? { performedAt: { $lt: new Date(before) } } : {}),
    })
      .sort({ performedAt: -1 })
      .limit(limit)
      .populate(populateEntries);
  }

  async getSessionById(id: string, userId: string) {
    return WorkoutSession.findOne({ _id: id, belongsTo: userId }).populate(populateEntries);
  }

  async createSession(userId: string, input: SessionInput) {
    await exerciseService.assertExercisesExist(input.entries.map((entry) => entry.exercise));

    let workoutName = input.workoutName ?? FREESTYLE_NAME;
    if (input.workout) {
      const workout = await Workout.findOne({ _id: input.workout, belongsTo: userId });
      if (!workout) {
        throw new HttpError(400, 'Workout not found.');
      }
      workoutName = workout.name;
    }

    const session = await WorkoutSession.create({
      belongsTo: userId,
      workout: input.workout ?? null,
      workoutName,
      performedAt: new Date(input.performedAt),
      durationMinutes: input.durationMinutes,
      notes: input.notes,
      entries: input.entries,
    });
    return session.populate(populateEntries);
  }

  async updateSession(id: string, userId: string, input: SessionUpdateInput) {
    const session = await WorkoutSession.findOne({ _id: id, belongsTo: userId });
    if (!session) {
      return null;
    }

    await exerciseService.assertExercisesExist(input.entries.map((entry) => entry.exercise));
    // Setting optional fields to undefined clears them.
    session.set({
      performedAt: new Date(input.performedAt),
      durationMinutes: input.durationMinutes,
      notes: input.notes,
      entries: input.entries,
    });
    await session.save();
    return session.populate(populateEntries);
  }

  async deleteSession(id: string, userId: string) {
    return WorkoutSession.findOneAndDelete({ _id: id, belongsTo: userId });
  }

  /** The sets from the most recent session that included each exercise. */
  async getLastPerformance(userId: string, exerciseIds: string[]) {
    const ids = exerciseIds.map((id) => new Types.ObjectId(id));
    return WorkoutSession.aggregate<{ exercise: string; performedAt: Date; sets: SessionSet[] }>([
      { $match: { belongsTo: new Types.ObjectId(userId), 'entries.exercise': { $in: ids } } },
      { $sort: { performedAt: -1 } },
      { $unwind: '$entries' },
      { $match: { 'entries.exercise': { $in: ids } } },
      {
        $group: {
          _id: '$entries.exercise',
          performedAt: { $first: '$performedAt' },
          sets: { $first: '$entries.sets' },
        },
      },
      { $project: { _id: 0, exercise: { $toString: '$_id' }, performedAt: 1, sets: 1 } },
    ]);
  }
}

export const sessionService = new SessionService();
