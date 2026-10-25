import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth.context';
import {
  exportPending,
  pendingSessions,
  removePending,
  subscribeOutbox,
  syncPending,
} from '@/lib/outbox';

export function SyncStatus() {
  const { user, sessionUnavailable } = useAuth();
  const queryClient = useQueryClient();
  const [revision, setRevision] = useState(0);
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [discardId, setDiscardId] = useState<string | null>(null);
  const owner = user?._id;
  const pending = useMemo(() => {
    void revision;
    return owner ? pendingSessions(owner) : [];
  }, [owner, revision]);
  const syncingRef = useRef(false);
  const retry = useCallback(async () => {
    if (!owner || syncingRef.current || sessionUnavailable) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      await syncPending(owner);
      await queryClient.invalidateQueries({ queryKey: ['sessions'] });
      await queryClient.invalidateQueries({ queryKey: ['stats'] });
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [owner, sessionUnavailable, queryClient]);
  useEffect(() => subscribeOutbox(() => setRevision((value) => value + 1)), []);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  useEffect(() => {
    if (!owner || sessionUnavailable) return;
    const sync = () => {
      if (navigator.onLine && pendingSessions(owner).some((item) => !item.error)) void retry();
    };
    if (online && revision >= 0) sync();
    window.addEventListener('online', sync);
    window.addEventListener('focus', sync);
    const timer = window.setInterval(sync, 30_000);
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', sync);
      window.removeEventListener('focus', sync);
    };
  }, [owner, online, sessionUnavailable, revision, retry]);
  if (!user || (online && !sessionUnavailable && pending.length === 0)) return null;
  return (
    <aside
      aria-label="Connection and saves"
      className="border-b border-border bg-card px-4 py-3 text-sm"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3" role="status">
        <span>
          {sessionUnavailable || !online
            ? 'Connection unavailable — showing data saved on this device.'
            : syncing
              ? 'Syncing your sessions…'
              : 'Your session is saved on this device.'}{' '}
          {pending.length > 0 &&
            `${pending.length} session${pending.length === 1 ? '' : 's'} waiting to sync.`}
        </span>
        {pending.length > 0 && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void retry()}
              disabled={syncing || !online || sessionUnavailable}
            >
              Retry saves
            </Button>
            <Button size="sm" variant="ghost" onClick={() => owner && exportPending(owner)}>
              Export pending saves
            </Button>
          </>
        )}
        {sessionUnavailable && (
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
            Reconnect
          </Button>
        )}
        {pending
          .filter((item) => item.error)
          .map((item) => (
            <div key={item.input.clientRequestId} className="w-full">
              <span>{item.error} </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDiscardId(item.input.clientRequestId ?? null)}
              >
                Remove blocked save
              </Button>
            </div>
          ))}
      </div>
      <ConfirmDialog
        open={discardId !== null}
        onOpenChange={(open) => {
          if (!open) setDiscardId(null);
        }}
        title="Remove pending save?"
        description="This removes the local copy. Export pending saves first if you want to keep a backup."
        confirmLabel="Remove save"
        pendingLabel="Removing…"
        pending={false}
        onConfirm={() => {
          if (owner && discardId) removePending(owner, discardId);
          setDiscardId(null);
        }}
      />
    </aside>
  );
}
