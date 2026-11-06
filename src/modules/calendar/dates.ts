import { locale } from '@/i18n'
const WEEK_LENGTH = 7
const MONTH_GRID_DAYS = 42

// Dates travel as local YYYY-MM-DD strings: a calendar day has no time zone.
export function toKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function fromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

function startOfWeek(date: Date) {
  const mondayBased = (date.getDay() + 6) % WEEK_LENGTH
  return addDays(date, -mondayBased)
}

function range(start: Date, length: number) {
  return Array.from({ length }, (_, index) => addDays(start, index))
}

export function weekDays(date: Date) {
  return range(startOfWeek(date), WEEK_LENGTH)
}

// Always six weeks, so the grid keeps its height from month to month.
export function monthDays(date: Date) {
  return range(startOfWeek(new Date(date.getFullYear(), date.getMonth(), 1)), MONTH_GRID_DAYS)
}

const monthFormat = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
const shortFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
const dayFormat = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' })

export function formatMonth(date: Date) {
  // Intl gives "ноябрь 2026 г." in Russian; the suffix is noise in a heading.
  const text = monthFormat.format(date).replace(/\s*г\.$/, '')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatWeek(days: Date[]) {
  return `${shortFormat.format(days[0])} – ${shortFormat.format(days[days.length - 1])}`
}

export function formatDay(date: Date) {
  const text = dayFormat.format(date)
  return text.charAt(0).toUpperCase() + text.slice(1)
}
