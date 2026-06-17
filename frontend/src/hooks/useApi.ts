const API_URL = '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function useApi() {
  return {
    get: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'GET' }),
    post: <T>(endpoint: string, body: unknown) => fetchApi<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(endpoint: string, body: unknown) => fetchApi<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    del: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'DELETE' }),
  };
}
