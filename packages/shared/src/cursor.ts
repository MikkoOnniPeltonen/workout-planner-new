import { z } from 'zod';
import { objectIdSchema } from './object-id.ts';

export const sessionCursorSchema = z
  .string()
  .max(80)
  .transform((value, ctx) => {
    const [date, id, extra] = value.split('~');
    if (
      !z.iso.datetime({ offset: true }).safeParse(date).success ||
      extra !== undefined ||
      (id !== undefined && !objectIdSchema.safeParse(id).success)
    ) {
      ctx.addIssue({ code: 'custom', message: 'Invalid session cursor.' });
      return z.NEVER;
    }
    return { date, id };
  });
export function sessionCursor(session: { performedAt: string; _id: string }) {
  return `${session.performedAt}~${session._id}`;
}
