import {
  objectIdSchema,
  SESSION_MAX_ENTRIES,
  sessionCursorSchema,
  sessionInputSchema,
  sessionUpdateSchema,
} from '@workout-planner/shared';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { getAuth } from '../middleware/session.middleware.ts';
import { sessionService } from '../services/session.service.ts';
import { statsService } from '../services/stats.service.ts';
import { HttpError } from '../utils/http-error.ts';
import { idParamsSchema, validate } from '../utils/validate.ts';
import { isValidTimeZone } from '../utils/weeks.ts';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  before: sessionCursorSchema.optional(),
});

const lastPerformanceQuerySchema = z.object({
  exercises: z
    .string({ error: 'Provide the exercise ids to look up.' })
    .transform((value) =>
      value
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    )
    .pipe(z.array(objectIdSchema).min(1).max(SESSION_MAX_ENTRIES)),
});

const statsQuerySchema = z.object({
  weeks: z.coerce.number().int().min(1).max(52).default(12),
  tz: z.string().default('UTC').refine(isValidTimeZone, 'Unknown time zone.'),
});

class SessionController {
  async listSessions(req: Request, res: Response) {
    const { _id: userId } = getAuth(req);
    const options = validate(listQuerySchema, req.query);
    res.json(await sessionService.listSessions(userId, options));
  }

  async getRecentExercises(req: Request, res: Response) {
    res.json(await sessionService.recentExercises(getAuth(req)._id));
  }

  async getStats(req: Request, res: Response) {
    const { _id: userId } = getAuth(req);
    const { weeks, tz } = validate(statsQuerySchema, req.query);
    res.json(await statsService.getStats(userId, { weeks, timeZone: tz }));
  }

  async getLastPerformance(req: Request, res: Response) {
    const { _id: userId } = getAuth(req);
    const { exercises } = validate(lastPerformanceQuerySchema, req.query);
    res.json(await sessionService.getLastPerformance(userId, exercises));
  }

  async getSessionById(req: Request, res: Response) {
    const { _id: userId } = getAuth(req);
    const { id } = validate(idParamsSchema, req.params);
    const session = await sessionService.getSessionById(id, userId);

    if (!session) {
      throw new HttpError(404, 'Session not found');
    }

    res.json(session);
  }

  async createSession(req: Request, res: Response) {
    const { _id: userId } = getAuth(req);
    const input = validate(sessionInputSchema, req.body);
    if (input.clientRequestId && req.get('X-Session-Owner') !== userId)
      throw new HttpError(409, 'Sign in to the account that created this pending save.');
    res.status(201).json(await sessionService.createSession(userId, input));
  }

  async updateSession(req: Request, res: Response) {
    const { _id: userId } = getAuth(req);
    const { id } = validate(idParamsSchema, req.params);
    const input = validate(sessionUpdateSchema, req.body);
    const session = await sessionService.updateSession(id, userId, input);

    if (!session) {
      throw new HttpError(404, 'Session not found');
    }

    res.json(session);
  }

  async deleteSession(req: Request, res: Response) {
    const { _id: userId } = getAuth(req);
    const { id } = validate(idParamsSchema, req.params);
    const session = await sessionService.deleteSession(id, userId);

    if (!session) {
      throw new HttpError(404, 'Session not found');
    }

    res.status(204).end();
  }
}

export const sessionController = new SessionController();
