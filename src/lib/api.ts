export async function request<T = void>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  if (!response.ok) {
    throw new Error(`Request to ${path} failed: ${response.status}`)
  }
  return response.status === 204 ? (undefined as T) : response.json()
}

export type Health = {
  status: 'ok' | 'degraded'
  database: 'up' | 'down'
}

export async function fetchHealth(): Promise<Health> {
  const response = await fetch('/api/health')
  // 503 still carries a health report: the server is up, the database is not.
  if (!response.ok && response.status !== 503) {
    throw new Error(`Health check failed: ${response.status}`)
  }
  return response.json()
}
