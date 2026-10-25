import { type SessionInput, sessionInputSchema } from '@workout-planner/shared';
import axios from 'axios';
import sessionsService from '@/services/sessions.service';

const PREFIX = 'workout-outbox:v1:';
const EVENT = 'workout-outbox-changed';
export interface PendingSession {
  owner: string;
  input: SessionInput;
  queuedAt: string;
  error?: string;
}
const key = (owner: string, id: string) => `${PREFIX}${owner}:${id}`;
function changed() {
  window.dispatchEvent(new Event(EVENT));
}
export function subscribeOutbox(listener: () => void) {
  window.addEventListener(EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}
export function pendingSessions(owner: string): PendingSession[] {
  const pending: PendingSession[] = [];
  try {
    void localStorage.length;
  } catch {
    return pending;
  }
  for (let i = 0; i < localStorage.length; i++) {
    const name = localStorage.key(i);
    if (!name?.startsWith(`${PREFIX}${owner}:`)) continue;
    try {
      const value = JSON.parse(localStorage.getItem(name) ?? 'null');
      const parsed = sessionInputSchema.safeParse(value?.input);
      if (
        value?.owner === owner &&
        parsed.success &&
        parsed.data.clientRequestId &&
        name === key(owner, parsed.data.clientRequestId)
      ) {
        pending.push({ ...value, input: parsed.data });
      }
    } catch {
      /* Ignore corrupted records without deleting recoverable data. */
    }
  }
  return pending.sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
}
export function queueSession(owner: string, input: SessionInput) {
  const validated = sessionInputSchema.parse(input);
  if (!validated.clientRequestId) throw new Error('A save identifier is required.');
  const name = key(owner, validated.clientRequestId);
  // An immutable snapshot: never replace a request whose first response may have been lost.
  if (!localStorage.getItem(name)) {
    localStorage.setItem(
      name,
      JSON.stringify({ owner, input: validated, queuedAt: new Date().toISOString() }),
    );
  }
  changed();
}
export function removePending(owner: string, id: string) {
  localStorage.removeItem(key(owner, id));
  changed();
}
export function isRetryable(error: unknown) {
  return (
    axios.isAxiosError(error) &&
    (!error.response || error.response.status >= 500 || [408, 429].includes(error.response.status))
  );
}
const running = new Map<string, Promise<void>>();
export function syncPending(owner: string): Promise<void> {
  const active = running.get(owner);
  if (active) return active;
  const work = (async () => {
    for (const item of pendingSessions(owner)) {
      if (item.error) continue;
      try {
        await sessionsService.createSession(item.input, owner);
        removePending(owner, item.input.clientRequestId as string);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) break;
        if (isRetryable(error)) break;
        localStorage.setItem(
          key(owner, item.input.clientRequestId as string),
          JSON.stringify({
            ...item,
            error: 'This save needs attention. Export a copy before removing it.',
          }),
        );
        changed();
      }
    }
  })().finally(() => {
    running.delete(owner);
  });
  running.set(owner, work);
  return work;
}
export function exportPending(owner: string) {
  const blob = new Blob(
    [JSON.stringify({ formatVersion: 1, pending: pendingSessions(owner) }, null, 2)],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'pending-workout-saves.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
