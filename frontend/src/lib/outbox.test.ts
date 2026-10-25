import { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import sessionsService from '@/services/sessions.service';
import { pendingSessions, queueSession, syncPending } from './outbox';

vi.mock('@/services/sessions.service', () => ({ default: { createSession: vi.fn() } }));
const owner = 'a'.repeat(24);
const other = 'b'.repeat(24);
const input = () => ({
  clientRequestId: crypto.randomUUID(),
  performedAt: new Date().toISOString(),
  entries: [{ exercise: 'c'.repeat(24), sets: [{ reps: 8, weightKg: 60, completed: true }] }],
});
beforeEach(() => {
  vi.mocked(sessionsService.createSession).mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe('durable session outbox', () => {
  it('preserves an immutable snapshot and scopes it to its original owner', () => {
    const original = input();
    queueSession(owner, original);
    queueSession(owner, { ...original, notes: 'changed after sending' });
    expect(pendingSessions(owner)[0].input).toEqual(original);
    expect(pendingSessions(other)).toEqual([]);
  });
  it('keeps a lost response pending and retries with the original UUID and owner', async () => {
    const original = input();
    queueSession(owner, original);
    vi.mocked(sessionsService.createSession).mockRejectedValueOnce(
      new AxiosError('Connection lost'),
    );
    await syncPending(owner);
    expect(pendingSessions(owner)).toHaveLength(1);
    vi.mocked(sessionsService.createSession).mockResolvedValueOnce({} as never);
    await syncPending(owner);
    expect(sessionsService.createSession).toHaveBeenNthCalledWith(2, original, owner);
    expect(pendingSessions(owner)).toEqual([]);
  });
  it('serializes simultaneous foreground retries', async () => {
    queueSession(owner, input());
    vi.mocked(sessionsService.createSession).mockResolvedValue({} as never);
    await Promise.all([syncPending(owner), syncPending(owner)]);
    expect(sessionsService.createSession).toHaveBeenCalledOnce();
  });
  it('preserves rejected snapshots for export and does not retry permanent failures forever', async () => {
    queueSession(owner, input());
    vi.mocked(sessionsService.createSession).mockRejectedValue({
      isAxiosError: true,
      response: { status: 400 },
    });
    await syncPending(owner);
    await syncPending(owner);
    expect(pendingSessions(owner)[0].error).toContain('needs attention');
    expect(sessionsService.createSession).toHaveBeenCalledOnce();
  });
  it('never sends another account’s pending sessions', async () => {
    queueSession(owner, input());
    await syncPending(other);
    expect(sessionsService.createSession).not.toHaveBeenCalled();
    expect(pendingSessions(owner)).toHaveLength(1);
  });
  it('reports storage failure before making a network request', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
    expect(() => queueSession(owner, input())).toThrow('Quota exceeded');
    expect(sessionsService.createSession).not.toHaveBeenCalled();
  });
});
