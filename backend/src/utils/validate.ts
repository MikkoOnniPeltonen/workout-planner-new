import { objectIdSchema } from '@workout-planner/shared';
import { z } from 'zod';
import { HttpError } from './http-error.ts';

export const idParamsSchema = z.object({ id: objectIdSchema });

/** Parses request input and turns the first validation issue into a 400 response. */
export function validate<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
): z.output<Schema> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message ?? 'Invalid request.');
  }
  return result.data;
}
