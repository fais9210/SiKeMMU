const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

function createJsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return data;
    },
    async text() {
      return typeof data === 'string' ? data : JSON.stringify(data);
    },
  };
}

async function readStorage(url: string) {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(`sikemmu:${url.replace(/^\//, '')}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function writeStorage(url: string, data: unknown) {
  if (typeof window === 'undefined') return data;
  window.localStorage.setItem(`sikemmu:${url.replace(/^\//, '')}`, JSON.stringify(data));
  return data;
}

function buildSupabaseUrl(url: string) {
  if (url.startsWith('/api/settings')) return `${SUPABASE_URL}/rest/v1/settings?id=eq.app-settings`;
  if (url.startsWith('/api/rapbm')) return `${SUPABASE_URL}/rest/v1/rapbm_items`;
  if (url.startsWith('/api/transactions')) return `${SUPABASE_URL}/rest/v1/transactions?order=id.desc`;
  if (url.startsWith('/api/teachers')) return `${SUPABASE_URL}/rest/v1/teachers?order=id.desc`;
  if (url.startsWith('/api/payroll') || url.startsWith('/api/payrolls')) return `${SUPABASE_URL}/rest/v1/payroll_records?order=id.desc`;
  if (url.startsWith('/api/inventory')) return `${SUPABASE_URL}/rest/v1/inventory?order=id.desc`;
  return `${SUPABASE_URL}/rest/v1/${url.replace(/^\//, '').replace(/^api\//, '')}`;
}

export async function apiFetch(url: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase();

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const headers = new Headers(options.headers || {});
    headers.set('apikey', SUPABASE_ANON_KEY);
    headers.set('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
    headers.set('Content-Type', 'application/json');

    const response = await fetch(buildSupabaseUrl(url), {
      ...options,
      method,
      headers,
      body: options.body,
    });

    const responseText = await response.text();
    let parsed: unknown = null;
    try {
      parsed = responseText ? JSON.parse(responseText) : null;
    } catch {
      parsed = responseText;
    }

    if (!response.ok) {
      throw new Error(typeof parsed === 'object' && parsed && 'message' in parsed ? String(parsed.message) : `HTTP error! status: ${response.status}`);
    }

    return {
      ok: response.ok,
      status: response.status,
      async json() {
        return parsed;
      },
      async text() {
        return responseText;
      },
    };
  }

  const storageKey = `sikemmu:${url.replace(/^\//, '')}`;
  if (method === 'GET') {
    const stored = await readStorage(url);
    return createJsonResponse(stored ?? [], 200);
  }

  if (method === 'POST') {
    const body = options.body ? JSON.parse(String(options.body)) : {};
    const existing = (await readStorage(url)) || [];
    const next = Array.isArray(existing) ? [...existing, body] : [body];
    await writeStorage(url, next);
    return createJsonResponse(body, 201);
  }

  if (method === 'PUT' || method === 'PATCH') {
    const body = options.body ? JSON.parse(String(options.body)) : {};
    await writeStorage(url, body);
    return createJsonResponse(body, 200);
  }

  if (method === 'DELETE') {
    await writeStorage(url, { success: true });
    return createJsonResponse({ success: true }, 200);
  }

  return createJsonResponse({ success: true }, 200);
}
