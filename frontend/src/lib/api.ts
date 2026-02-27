const BASE = '';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

// Auth
export const signup = (email: string, password: string, company_name?: string) =>
  request<{ access_token: string }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, company_name }),
  });

export const login = (email: string, password: string) =>
  request<{ access_token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const getMe = () => request<{ id: string; email: string; company_name: string | null }>('/auth/me');

// Keys
export const createKey = (anthropic_api_key: string, label?: string) =>
  request<{ id: string; proxy_key: string; key_prefix: string; label: string | null }>('/keys', {
    method: 'POST',
    body: JSON.stringify({ anthropic_api_key, label }),
  });

export const listKeys = () =>
  request<Array<{ id: string; key_prefix: string; label: string | null; created_at: string }>>('/keys');

export const deleteKey = (keyId: string) =>
  request<void>(`/keys/${keyId}`, { method: 'DELETE' });

// Analytics
export const getSummary = (period = '30d') =>
  request<{
    total_requests: number;
    total_input_tokens: number;
    total_output_tokens: number;
    total_cost: number;
    avg_latency_ms: number;
    period: string;
  }>(`/analytics/summary?period=${period}`);

export const getCostOverTime = (period = '30d', granularity = 'day') =>
  request<Array<{ date: string; requests: number; cost: number; input_tokens: number; output_tokens: number }>>(
    `/analytics/cost-over-time?period=${period}&granularity=${granularity}`
  );

export const getByModel = (period = '30d') =>
  request<Array<{ model: string; requests: number; cost: number; input_tokens: number; output_tokens: number }>>(
    `/analytics/by-model?period=${period}`
  );

export const getByKey = (period = '30d') =>
  request<Array<{ key_prefix: string; label: string | null; requests: number; cost: number }>>(
    `/analytics/by-key?period=${period}`
  );

export const getRequestLogs = (page = 1, limit = 50) =>
  request<{
    total: number;
    page: number;
    limit: number;
    data: Array<{
      id: string;
      model: string;
      input_tokens: number;
      output_tokens: number;
      cost_usd: number;
      status_code: number;
      latency_ms: number;
      endpoint: string;
      created_at: string;
    }>;
  }>(`/analytics/requests?page=${page}&limit=${limit}`);
