export class ApiError extends Error {
  readonly status: number
  // The server's reason, for choosing a message to show.
  readonly reason: string

  constructor(path: string, status: number, reason: string) {
    super(`Request to ${path} failed: ${status}`)
    this.status = status
    this.reason = reason
  }
}

async function readReason(response: Response) {
  try {
    const body: { error?: string } = await response.json()
    return body.error ?? ''
  } catch {
    return ''
  }
}

const AUTH_PATH = '/api/auth/'
const LOGIN_PAGE = '/login'

export async function request<T = void>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  if (!response.ok) {
    // An expired session ends here, wherever the user is in the app.
    if (response.status === 401 && !path.startsWith(AUTH_PATH)) window.location.assign(LOGIN_PAGE)
    throw new ApiError(path, response.status, await readReason(response))
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
