// Offline Synchronization Manager for Progressive Web App (PWA)

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
  description?: string;
}

const QUEUE_STORAGE_KEY = 'madrasah_offline_sync_queue';
const CACHE_PREFIX = 'madrasah_cache_';

type QueueChangeCallback = (queueCount: number, isSyncing: boolean, lastSyncSuccess?: boolean) => void;
const listeners: Set<QueueChangeCallback> = new Set();
let isCurrentlyFlushing = false;

export function getOfflineQueue(): QueuedRequest[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to read offline sync queue:', e);
    return [];
  }
}

export function saveOfflineQueue(queue: QueuedRequest[]): void {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    notifyListeners(queue.length, isCurrentlyFlushing);
  } catch (e) {
    console.warn('Failed to save offline sync queue:', e);
  }
}

export function enqueueRequest(url: string, options: RequestInit = {}): void {
  const method = (options.method || 'GET').toUpperCase();
  if (['GET', 'HEAD'].includes(method)) return; // Only queue mutations

  const queue = getOfflineQueue();
  const headers: Record<string, string> = {};
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((v, k) => {
        headers[k] = v;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([k, v]) => {
        headers[k] = v;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  const newItem: QueuedRequest = {
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    url,
    method,
    headers,
    body: typeof options.body === 'string' ? options.body : undefined,
    timestamp: Date.now(),
    description: `${method} ${url}`,
  };

  queue.push(newItem);
  saveOfflineQueue(queue);
  console.log(`[OfflineSync] Request queued (${queue.length} pending):`, newItem.description);
}

export async function flushOfflineQueue(onSuccessCallback?: () => void): Promise<{ successCount: number; failCount: number }> {
  if (isCurrentlyFlushing) return { successCount: 0, failCount: 0 };
  if (!navigator.onLine) {
    console.log('[OfflineSync] Cannot flush queue: Device is currently offline.');
    return { successCount: 0, failCount: 0 };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) return { successCount: 0, failCount: 0 };

  isCurrentlyFlushing = true;
  notifyListeners(queue.length, true);

  console.log(`[OfflineSync] Starting background sync of ${queue.length} pending items...`);
  let successCount = 0;
  let failCount = 0;
  const remainingQueue: QueuedRequest[] = [];

  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          ...item.headers,
        },
        body: item.body,
      });

      if (response.ok || response.status === 201 || response.status === 200 || response.status === 404) {
        // If 404 on delete/update, consider resolved
        successCount++;
        console.log(`[OfflineSync] Synced item successfully: ${item.description}`);
      } else {
        console.warn(`[OfflineSync] Server responded with error status ${response.status} for ${item.description}`);
        // Keep in queue to retry later if server error (5xx)
        if (response.status >= 500) {
          remainingQueue.push(item);
          failCount++;
        } else {
          // Client error 4xx (e.g. malformed or duplicate), discard to avoid clogging
          successCount++;
        }
      }
    } catch (err) {
      console.error(`[OfflineSync] Network failure while syncing ${item.description}:`, err);
      remainingQueue.push(item);
      failCount++;
      // Stop flushing if network dropped again
      break;
    }
  }

  saveOfflineQueue(remainingQueue);
  isCurrentlyFlushing = false;
  notifyListeners(remainingQueue.length, false, successCount > 0);

  if (successCount > 0 && onSuccessCallback) {
    onSuccessCallback();
  }

  return { successCount, failCount };
}

export function subscribeQueueChanges(cb: QueueChangeCallback): () => void {
  listeners.add(cb);
  // Initial fire
  cb(getOfflineQueue().length, isCurrentlyFlushing);
  return () => {
    listeners.delete(cb);
  };
}

function notifyListeners(queueCount: number, isSyncing: boolean, lastSyncSuccess?: boolean) {
  listeners.forEach((cb) => {
    try {
      cb(queueCount, isSyncing, lastSyncSuccess);
    } catch (e) {
      console.error('Error notifying sync listener:', e);
    }
  });
}

// Local Cache helpers for instant offline boot
export function saveLocalCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Failed to save local cache for ${key}:`, e);
  }
}

export function getLocalCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn(`Failed to load local cache for ${key}:`, e);
    return fallback;
  }
}

// Auto-register window online / offline event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[OfflineSync] Internet connection restored. Triggering auto-sync...');
    setTimeout(() => {
      flushOfflineQueue();
    }, 1500);
  });
}
