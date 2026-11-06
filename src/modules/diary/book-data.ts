import { locale } from '@/i18n'
import { localDate, parseLocalDate, weekStart } from '@/lib/dates'
import type { Day, Note, Summary } from './api'

export type BookDay = { date: string; notes: Note[]; day: Day | undefined }

export type BookItem =
  | { type: 'month'; key: string; title: string; dates: string[] }
  | { type: 'day'; key: string; value: BookDay }
  | { type: 'week'; key: string; summary: Summary }

const monthFormat = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })

const isMarked = (day: Day) => Boolean(day.moods.length > 0 || day.score || day.summary)

function datesOfMonth(date: string) {
  const first = parseLocalDate(date)
  const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  return Array.from({ length: count }, (_, index) =>
    localDate(new Date(first.getFullYear(), first.getMonth(), index + 1)),
  )
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// The diary as one story, oldest day first: months open chapters, and each week
// ends with its summary.
export function buildBook(notes: Note[], days: Map<string, Day>, summaries: Summary[]) {
  const notesByDate = new Map<string, Note[]>()
  // The list comes newest first, and a book reads the other way.
  for (const note of [...notes].reverse()) {
    if (note.dailyDate) notesByDate.set(note.dailyDate, [...(notesByDate.get(note.dailyDate) ?? []), note])
  }
  const marked = [...days.values()].filter(isMarked).map((day) => day.date)
  const dates = [...new Set([...notesByDate.keys(), ...marked])].sort()
  const weekSummaries = new Map(
    summaries.filter((summary) => summary.status === 'done').map((summary) => [summary.week, summary]),
  )

  const items: BookItem[] = []
  dates.forEach((date, index) => {
    const month = date.slice(0, 7)
    if (month !== dates[index - 1]?.slice(0, 7)) {
      items.push({
        type: 'month',
        key: `month-${month}`,
        title: capitalize(monthFormat.format(parseLocalDate(date))),
        dates: datesOfMonth(date),
      })
    }
    items.push({ type: 'day', key: date, value: { date, notes: notesByDate.get(date) ?? [], day: days.get(date) } })

    const week = weekStart(parseLocalDate(date))
    const next = dates[index + 1]
    const summary = weekSummaries.get(week)
    if (summary && (!next || weekStart(parseLocalDate(next)) !== week)) {
      items.push({ type: 'week', key: `week-${week}`, summary })
    }
  })
  return { items, dates }
}
