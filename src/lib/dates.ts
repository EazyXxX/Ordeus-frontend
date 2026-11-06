import { locale } from '@/i18n'
// A calendar day as the author sees it, as YYYY-MM-DD in local time.
export function localDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

// The Monday of the week that holds this date, as YYYY-MM-DD.
export function weekStart(date: Date) {
  const daysSinceMonday = (date.getDay() + 6) % 7
  return localDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceMonday))
}

const dayFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' })

// A week as text, such as "2–8 ноября 2026 г.", from its Monday.
export function weekLabel(week: string) {
  const monday = parseLocalDate(week)
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)
  return dayFormat.formatRange(monday, sunday)
}

export function parseLocalDate(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}
