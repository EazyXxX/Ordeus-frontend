import { request } from '@/lib/api'
import type { Capture } from '@/components/zen/useCaptures'
import type { Color } from '@/lib/colors'
import { localDate } from '@/lib/dates'
import type { Priority } from './appearance'

export type ChecklistItem = {
  title: string
  done: boolean
}

export type CardInput = {
  title: string
  description: string
  color: Color | ''
  priority: Priority
  dueDate: string | null
  checklist: ChecklistItem[]
}

export type Card = CardInput & {
  id: string
  columnId: string
  createdAt: string
  updatedAt: string
}

export type Column = {
  id: string
  title: string
  color: Color
  cards: Card[]
}

type Board = { columns: Column[] }

export const BOARD_QUERY_KEY = ['kanban', 'board']
export const CAPTURES_KEY = ['kanban', 'captures']

const BASE = '/api/kanban'

function send<T = void>(path: string, method: string, body?: unknown) {
  return request<T>(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export const fetchBoard = () => request<Board>(`${BASE}/board`)

export const createColumn = (title: string) => send('/columns', 'POST', { title })
export const updateColumn = (id: string, changes: { title?: string; color?: Color }) =>
  send(`/columns/${id}`, 'PATCH', changes)
export const deleteColumn = (id: string) => send(`/columns/${id}`, 'DELETE')
export const moveColumn = (id: string, index: number) => send(`/columns/${id}/move`, 'POST', { index })

export const createCard = (columnId: string, title: string) => send('/cards', 'POST', { columnId, title })
export const updateCard = (id: string, input: CardInput) => send(`/cards/${id}`, 'PATCH', input)
export const deleteCard = (id: string) => send(`/cards/${id}`, 'DELETE')
export const moveCard = (id: string, columnId: string, index: number) =>
  send(`/cards/${id}/move`, 'POST', { columnId, index })

export const fetchCaptures = () => request<Capture[]>(`${BASE}/captures`)
// The author's date, so words like "tomorrow" mean the day they were written.
export const createCapture = (text: string) => send('/captures', 'POST', { text, today: localDate(new Date()) })
export const retryCapture = (id: string) => send(`/captures/${id}/retry`, 'POST')
export const deleteCapture = (id: string) => send(`/captures/${id}`, 'DELETE')
