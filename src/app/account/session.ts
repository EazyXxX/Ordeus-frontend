import { useQuery } from '@tanstack/react-query'

import { ApiError, request } from '@/lib/api'
import type { Color } from '@/lib/colors'

export type Account = {
  id: string
  email: string
  name: string
  color: Color
}

export type Session = {
  user: Account
  accounts: Account[]
}

export type AccountStats = {
  notes: number
  tasks: number
  calendarNotes: number
  folders: number
}

export const SESSION_KEY = ['auth', 'session']

function post<T = void>(path: string, body?: unknown, method = 'POST') {
  return request<T>(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

async function fetchSession() {
  try {
    return await request<Session>('/api/auth/session')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export function useSession() {
  return useQuery({ queryKey: SESSION_KEY, queryFn: fetchSession, retry: false, staleTime: Infinity })
}

// For anything under RequireAuth, which renders only with a session.
export function useCurrentUser() {
  const { data } = useSession()
  if (!data) throw new Error('useCurrentUser needs a signed-in account')
  return data.user
}

export const signIn = (input: { email: string; password: string }) => post<Session>('/api/auth/login', input)
export const signUp = (input: { email: string; name: string; password: string }) =>
  post<Session>('/api/auth/register', input)
export const switchAccount = (userId: string) => post<Session>('/api/auth/switch', { userId })
export const signOut = () => post<Session | undefined>('/api/auth/logout')

export const updateProfile = (input: { name: string; color: Color }) => post('/api/account', input, 'PATCH')
export const changePassword = (input: { current: string; next: string }) => post('/api/account/password', input)
export const fetchStats = () => request<AccountStats>('/api/account/stats')

// A full reload is what guarantees that nothing from the previous account
// survives: not the query cache, the filters or the graph layout.
export function enterApp(path = '/') {
  window.location.assign(path)
}
