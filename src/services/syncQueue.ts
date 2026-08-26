/**
 * Sync Queue Manager - Offline sync disabled as requested
 */

export interface PendingSyncItem {
  id: string;
  action: string;
  payload: any;
  timestamp: number;
  description: string;
  retryCount: number;
  lastError?: string;
}

export function getPendingQueue(): PendingSyncItem[] {
  try {
    localStorage.removeItem('banban_pending_sync_queue');
  } catch (e) {}
  return [];
}

export function subscribeSyncStatus(callback: (queue: PendingSyncItem[]) => void): () => void {
  callback([]);
  return () => {};
}

export function enqueueSyncItem(action?: string, payload?: any, description?: string): PendingSyncItem {
  return {
    id: '',
    action: action || '',
    payload: payload || null,
    timestamp: Date.now(),
    description: description || '',
    retryCount: 0
  };
}

export function removeSyncItem(_id: string): void {}
export function clearSyncQueue(): void {}

export async function processSyncQueue(): Promise<{ processed: number; failed: number; errors: string[] }> {
  return { processed: 0, failed: 0, errors: [] };
}
