import { request } from '@/lib/api'
import type { Capture } from '@/components/zen/useCaptures'
import type { Color } from '@/lib/colors'
import { localDate } from '@/lib/dates'

export type NoteRef = { id: string; title: string }

export type Note = {
  id: string
  title: string
  body: string
  folder: string
  tags: string[]
  links: NoteRef[]
  fromAi: boolean
  // Set on daily notes: the day the note describes.
  dailyDate: string | null
  createdAt: string
  updatedAt: string
}

export type NoteInput = Pick<Note, 'title' | 'body' | 'folder' | 'tags' | 'dailyDate'> & { linkIds: string[] }

export type Folder = { id: string; name: string; color: Color; notes: number }
export type Tag = { id: string; name: string; color: Color; notes: number }
export function colorsByName(items: { name: string; color: Color }[] = []) {
  return new Map(items.map(({ name, color }) => [name, color]))
}

export type NoteFilter = { folder?: string; tag?: string; q?: string; daily?: string }

// Everything derived from notes shares this prefix, so it refreshes together.
export const LIBRARY_KEY = ['diary', 'library']
export const CAPTURES_KEY = ['diary', 'captures']

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

export const deleteTag = (id: string) => send(`/tags/${id}`, 'DELETE')
export const fetchTags = () => request<Tag[]>(`${BASE}/tags`)
export const updateTagColor = (id: string, color: Color) => send(`/tags/${id}`, 'PATCH', { color })

export const fetchCaptures = () => request<Capture[]>(`${BASE}/captures`)
// The author's date, so words like "yesterday" mean the day they were written.
export const createCapture = (text: string) => send('/captures', 'POST', { text, today: localDate(new Date()) })
export const retryCapture = (id: string) => send(`/captures/${id}/retry`, 'POST')
export const deleteCapture = (id: string) => send(`/captures/${id}`, 'DELETE')
