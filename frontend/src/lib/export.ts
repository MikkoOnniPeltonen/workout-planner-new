import type { WorkoutSession } from '@workout-planner/shared';
import sessionsService from '@/services/sessions.service';

const EXPORT_PAGE_SIZE = 100;

async function getAllSessions(): Promise<WorkoutSession[]> {
  const sessions: WorkoutSession[] = [];
  let before: string | undefined;

  while (true) {
    const page = await sessionsService.getSessions({ limit: EXPORT_PAGE_SIZE, before });
    sessions.push(...page);
    if (page.length < EXPORT_PAGE_SIZE) break;

    const nextBefore = page.at(-1)?.performedAt;
    if (!nextBefore || nextBefore === before) break;
    before = nextBefore;
  }

  return sessions;
}

/** Downloads a portable JSON snapshot of the user's logged training history. */
export async function downloadSessionExport(): Promise<void> {
  const sessions = await getAllSessions();
  const payload = {
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    sessions,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `workout-planner-export-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
