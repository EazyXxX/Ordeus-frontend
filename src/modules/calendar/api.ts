import { request } from '@/lib/api'
import type { Color } from '@/lib/colors'

export type CalendarNote = {
  id: string
  date: string
  time: string | null
  title: string
  body: string
  color: Color
}

export type NoteInput = Omit<CalendarNote, 'id'>

export type CalendarTask = {
  id: string
  date: string
  title: string
  color: Color | ''
  priority: string
  columnTitle: string
  columnColor: Color
}

type CalendarRange = {
  notes: CalendarNote[]
  tasks: CalendarTask[]
}

export const CALENDAR_KEY = ['calendar']

const NOTES = '/api/calendar/notes'

function send(path: string, method: string, body?: NoteInput) {
  return request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function fetchRange(from: string, to: string) {
  return request<CalendarRange>(`/api/calendar?${new URLSearchParams({ from, to })}`)
}

export const createNote = (input: NoteInput) => send(NOTES, 'POST', input)
export const updateNote = (id: string, input: NoteInput) => send(`${NOTES}/${id}`, 'PATCH', input)
export const deleteNote = (id: string) => send(`${NOTES}/${id}`, 'DELETE')
