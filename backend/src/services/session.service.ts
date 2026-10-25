import { createHash } from 'node:crypto';
import type { SessionInput, SessionSet, SessionUpdateInput } from '@workout-planner/shared';
import { Types } from 'mongoose';
import { User } from '../models/User.model.ts';
import { Workout } from '../models/Workout.model.ts';
import { WorkoutSession } from '../models/WorkoutSession.model.ts';
import { HttpError } from '../utils/http-error.ts';
import { isDuplicateKeyError } from '../utils/mongo-errors.ts';
import { exerciseService } from './exercise.service.ts';

const FREESTYLE_NAME = 'Freestyle session';

const populateEntries = { path: 'entries.exercise', populate: { path: 'belongsTo' } };

interface ListOptions {
  limit: number;
  /** ISO date; only sessions performed before it are returned (for paging). */
  before?: { date: string; id?: string };
}

// Every query is scoped to the owner, like workouts.
class SessionService {
  async listSessions(userId: string, { limit, before }: ListOptions) {
    return WorkoutSession.find({
      belongsTo: userId,
      ...(before
        ? before.id
          ? {
              $or: [
                { performedAt: { $lt: new Date(before.date) } },
                { performedAt: new Date(before.date), _id: { $lt: new Types.ObjectId(before.id) } },
              ],
            }
          : { performedAt: { $lt: new Date(before.date) } }
        : {}),
    })
      .sort({ performedAt: -1, _id: -1 })
      .limit(limit)
      .populate(populateEntries);
  }

  async getSessionById(id: string, userId: string) {
    return WorkoutSession.findOne({ _id: id, belongsTo: userId }).populate(populateEntries);
  }

  async createSession(userId: string, input: SessionInput) {
    const requestHash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
    const replay = async () => {
      const previous = await WorkoutSession.findOne({
        belongsTo: userId,
        clientRequestId: input.clientRequestId,
      }).select('+requestHash');
      if (!previous) return null;
      if (previous.requestHash !== requestHash)
        throw new HttpError(
          409,
          'This save identifier was already used for different session data.',
        );
      return previous.populate(populateEntries);
    };
    if (input.clientRequestId) {
      const previous = await replay();
      if (previous) return previous;
    }

    await exerciseService.assertExercisesExist(input.entries.map((entry) => entry.exercise));

    let workoutName = input.workoutName ?? FREESTYLE_NAME;
    if (input.workout) {
      const workout = await Workout.findOne({ _id: input.workout, belongsTo: userId });
      if (!workout) {
        throw new HttpError(400, 'Workout not found.');
      }
      workoutName = workout.name;
    }

    try {
      const session = await WorkoutSession.create({
        expiresAt: (await User.findById(userId))?.expiresAt,
        clientRequestId: input.clientRequestId,
        requestHash,
        belongsTo: userId,
        workout: input.workout ?? null,
        workoutName,
        performedAt: new Date(input.performedAt),
        durationMinutes: input.durationMinutes,
        notes: input.notes,
        entries: input.entries,
      });
      return session.populate(populateEntries);
    } catch (error) {
      if (input.clientRequestId && isDuplicateKeyError(error)) {
        const previous = await replay();
        if (previous) return previous;
      }
      throw error;
    }
  }

  async updateSession(id: string, userId: string, input: SessionUpdateInput) {
    const session = await WorkoutSession.findOne({ _id: id, belongsTo: userId });
    if (!session) {
      return null;
    }

    await exerciseService.assertExercisesExist(input.entries.map((entry) => entry.exercise));
    if (!input.expectedUpdatedAt) throw new HttpError(428, 'Reload the session before editing it.');
    const updated = await WorkoutSession.findOneAndUpdate(
      { _id: id, belongsTo: userId, updatedAt: new Date(input.expectedUpdatedAt) },
      {
        $set: {
          performedAt: new Date(input.performedAt),
          entries: input.entries,
          ...(input.durationMinutes !== undefined
            ? { durationMinutes: input.durationMinutes }
            : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
        },
        $unset: {
          ...(input.durationMinutes === undefined ? { durationMinutes: 1 } : {}),
          ...(input.notes === undefined ? { notes: 1 } : {}),
        },
      },
      { returnDocument: 'after', runValidators: true },
    ).populate(populateEntries);
    if (!updated)
      throw new HttpError(
        409,
        'This session changed on another device. Reload it before editing; your changes have not been saved.',
      );
    return updated;
  }

  async deleteSession(id: string, userId: string) {
    return WorkoutSession.findOneAndDelete({ _id: id, belongsTo: userId });
  }

  /** The sets from the most recent session that included each exercise. */
  async recentExercises(userId: string) {
    return WorkoutSession.distinct('entries.exercise', {
      belongsTo: userId,
      performedAt: { $gte: new Date(Date.now() - 7 * 86400000), $lte: new Date() },
    }).then((ids) => ids.map(String));
  }

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
