import { request } from '@/lib/api'
import type { Color } from '@/lib/colors'

export type NoteRef = { id: string; title: string }

export type Note = {
  id: string
  title: string
  body: string
  folder: string
  tags: string[]
  links: NoteRef[]
  fromAi: boolean
  createdAt: string
  updatedAt: string
}

export type NoteInput = Pick<Note, 'title' | 'body' | 'folder' | 'tags'> & { linkIds: string[] }

export type Folder = { id: string; name: string; color: Color; notes: number }
export type Tag = { id: string; name: string; color: Color; notes: number }
export function colorsByName(items: { name: string; color: Color }[] = []) {
  return new Map(items.map(({ name, color }) => [name, color]))
}

export type NoteFilter = { folder?: string; tag?: string; q?: string }

export type Capture = {
  id: string
  text: string
  status: 'pending' | 'processing' | 'failed'
  error: string
  createdAt: string
}

export type ModelList = {
  current: string
  models: string[]
  available: boolean
}

// Everything derived from notes shares this prefix, so it refreshes together.
export const LIBRARY_KEY = ['diary', 'library']
export const CAPTURES_KEY = ['diary', 'captures']
export const MODELS_KEY = ['ai', 'models']

const BASE = '/api/diary'

function send<T = void>(path: string, method: string, body?: unknown) {
  return request<T>(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function fetchNotes(filter: NoteFilter) {
  const params = new URLSearchParams(Object.entries(filter).filter(([, value]) => value))
  return request<Note[]>(`${BASE}/notes?${params}`)
}

export const createNote = (input: NoteInput) => send('/notes', 'POST', input)
export const updateNote = (id: string, input: NoteInput) => send(`/notes/${id}`, 'PATCH', input)
export const deleteNote = (id: string) => send(`/notes/${id}`, 'DELETE')

export const fetchFolders = () => request<Folder[]>(`${BASE}/folders`)
export const updateFolder = (id: string, changes: { name?: string; color?: Color }) =>
  send(`/folders/${id}`, 'PATCH', changes)
export const deleteFolder = (id: string) => send(`/folders/${id}`, 'DELETE')

export const fetchTags = () => request<Tag[]>(`${BASE}/tags`)
export const updateTagColor = (id: string, color: Color) => send(`/tags/${id}`, 'PATCH', { color })

export const fetchCaptures = () => request<Capture[]>(`${BASE}/captures`)
export const createCapture = (text: string) => send('/captures', 'POST', { text })
export const retryCapture = (id: string) => send(`/captures/${id}/retry`, 'POST')
export const deleteCapture = (id: string) => send(`/captures/${id}`, 'DELETE')

export const fetchModels = () => request<ModelList>('/api/ai/models')
export const selectModel = (model: string) =>
  request('/api/ai/model', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model }),
  })

export const transcribeAudio = (wav: Blob) =>
  request<{ text: string }>('/api/ai/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'audio/wav' },
    body: wav,
  })
