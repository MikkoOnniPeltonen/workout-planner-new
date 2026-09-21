// Unsaved form state kept in localStorage, so a refresh or a locked phone mid-workout loses nothing.
// Storage can be full or blocked (e.g. private browsing); drafts are best-effort, so failures are ignored.

export function loadDraft(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDraft(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best-effort; see above.
  }
}

export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Best-effort; see above.
  }
}
