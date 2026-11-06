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

// How a folder or tag looks next to its name: the emoji, or a color dot without one.
export type Mark = { color: Color; emoji: string }

export type Folder = Mark & { id: string; name: string; notes: number }
export type Tag = Mark & { id: string; name: string; notes: number }
export function colorsByName(items: { name: string; color: Color }[] = []) {
  return new Map(items.map(({ name, color }) => [name, color]))
}
export function emojisByName(items: (Mark & { name: string })[] = []) {
  return new Map(items.map(({ name, emoji }) => [name, emoji]))
}
export function marksByName(items: (Mark & { name: string })[] = []) {
  return new Map(items.map(({ name, color, emoji }) => [name, { color, emoji }]))
}

export type NoteFilter = { folder?: string; tag?: string; q?: string; daily?: string; from?: string; to?: string }

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
export const updateFolder = (id: string, changes: { name?: string; color?: Color; emoji?: string }) =>
  send(`/folders/${id}`, 'PATCH', changes)
export const deleteFolder = (id: string) => send(`/folders/${id}`, 'DELETE')

export const deleteTag = (id: string) => send(`/tags/${id}`, 'DELETE')
export const fetchTags = () => request<Tag[]>(`${BASE}/tags`)
export const updateTag = (id: string, changes: { color?: Color; emoji?: string }) =>
  send(`/tags/${id}`, 'PATCH', changes)

export type Summary = {
  id: string
  // The Monday the week starts on.
  week: string
  status: 'pending' | 'processing' | 'done' | 'failed'
  error: string
  headline: string
  text: string
  highlights: string[]
  themes: string[]
  focus: string
  noteCount: number
  updatedAt: string
}

export type Mood =
  | 'joy'
  | 'inspired'
  | 'grateful'
  | 'calm'
  | 'neutral'
  | 'obsessed'
  | 'swings'
  | 'apathy'
  | 'tired'
  | 'sad'
  | 'anxious'
  | 'angry'

export type Day = {
  date: string
  moods: Mood[]
  score: number | null
  summaryStatus: 'none' | 'pending' | 'processing' | 'done' | 'failed' | 'deleted'
  summary: string
  focus: string
  summarizedAt: string | null
}

export const DAYS_KEY = ['diary', 'days']

export const fetchDays = () => request<Day[]>(`${BASE}/days`)
export const updateDay = (date: string, mark: Pick<Day, 'moods' | 'score'>) => send(`/days/${date}`, 'PUT', mark)
export const requestDaySummary = (date: string, force: boolean) =>
  send(`/days/${date}/summary`, 'POST', { force })

export const deleteDaySummary = (date: string) => send(`/days/${date}/summary`, 'DELETE')

export const SUMMARIES_KEY = ['diary', 'summaries']

export const fetchSummaries = () => request<Summary[]>(`${BASE}/summaries`)
export const requestSummary = (week: string, force: boolean) => send('/summaries', 'POST', { week, force })
export const deleteSummary = (id: string) => send(`/summaries/${id}`, 'DELETE')

export const fetchCaptures = () => request<Capture[]>(`${BASE}/captures`)
// The author's date, so words like "yesterday" mean the day they were written.
export const createCapture = (text: string) => send('/captures', 'POST', { text, today: localDate(new Date()) })
export const retryCapture = (id: string) => send(`/captures/${id}/retry`, 'POST')
export const deleteCapture = (id: string) => send(`/captures/${id}`, 'DELETE')
