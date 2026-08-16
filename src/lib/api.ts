import { enqueueRequest } from './syncManager';

export async function apiFetch(url: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // If known to be offline and performing mutation, immediately enqueue
  if (typeof navigator !== 'undefined' && !navigator.onLine && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    console.log(`[apiFetch] Offline mode: Enqueueing ${method} ${url}`);
    enqueueRequest(url, { ...options, headers });
    
    // Return synthetic 200 OK Response
    return new Response(
      options.body && typeof options.body === 'string' ? options.body : JSON.stringify({ success: true, offlineQueued: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!response.ok) {
      let errorMsg = `HTTP error! status: ${response.status}`;
      if (isJson) {
        const errorData = await response.json().catch(() => ({}));
        errorMsg = errorData.error || errorMsg;
      }
      throw new Error(errorMsg);
    }

    if (!isJson) {
      throw new Error(`Expected JSON response from ${url} but received non-JSON (${contentType || 'unknown'})`);
    }

    return response;
  } catch (err: unknown) {
    // If network failure / connection dropped during fetch and it's a mutation, enqueue it
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      console.warn(`[apiFetch] Network error on ${method} ${url}. Enqueueing for auto-sync when online:`, err);
      enqueueRequest(url, { ...options, headers });

      return new Response(
        options.body && typeof options.body === 'string' ? options.body : JSON.stringify({ success: true, offlineQueued: true }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    throw err;
  }
}


