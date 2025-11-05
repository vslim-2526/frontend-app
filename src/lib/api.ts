export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export async function apiPut<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    body: JSON.stringify(body),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PUT ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export async function apiDelete<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    body: body ? JSON.stringify(body) : undefined,
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DELETE ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}




