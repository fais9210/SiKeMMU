export async function apiFetch(url: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

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
}

