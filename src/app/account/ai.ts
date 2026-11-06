import { request } from '@/lib/api'

export type AiProvider = 'local' | 'remote'

export type AiSettings = {
  provider: AiProvider
  local: {
    model: string
    models: string[]
    available: boolean
  }
  remote: {
    baseUrl: string
    model: string
    hasApiKey: boolean
    keyHint: string
  }
}

export type RemoteInput = {
  baseUrl: string
  model: string
  apiKey: string
}

export type AiSettingsChange = {
  provider?: AiProvider
  localModel?: string
  remote?: RemoteInput
}

export const AI_KEY = ['ai', 'settings']

const jsonRequest = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: body === undefined ? undefined : JSON.stringify(body),
})

export const fetchAiSettings = () => request<AiSettings>('/api/ai/settings')
export const updateAiSettings = (change: AiSettingsChange) =>
  request<AiSettings>('/api/ai/settings', jsonRequest('PATCH', change))
export const deleteRemoteAi = () => request<AiSettings>('/api/ai/remote', jsonRequest('DELETE'))
export const fetchRemoteModels = (input: { baseUrl: string; apiKey: string }) =>
  request<{ models: string[] }>('/api/ai/remote/models', jsonRequest('POST', input))
