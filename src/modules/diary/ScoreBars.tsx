import { locale, t } from '@/i18n'
import { parseLocalDate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { Day } from './api'
import { moodsOf } from './moods'

const MAX_SCORE = 10
const dayFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' })

type ScoreBarsProps = {
  dates: string[]
  days: Map<string, Day>
  onSelect?: (date: string) => void
}

// One bar per day, as tall as its score. A day without a score keeps its place,
// so gaps stay visible.
export function ScoreBars({ dates, days, onSelect }: ScoreBarsProps) {
  return (
    <div>
      <div aria-hidden className="relative flex h-20 items-end gap-0.5 border-b">
        {dates.map((date) => {
          const day = days.get(date)
          const moods = moodsOf(day)
          return (
            <button
              key={date}
              type="button"
              tabIndex={-1}
              onClick={() => onSelect?.(date)}
              className={cn('group relative flex h-full min-w-0 flex-1 items-end outline-none', !onSelect && 'cursor-default')}
            >
              {day?.score ? (
                <span
                  className="w-full rounded-t-sm bg-blue-500 group-hover:bg-blue-400"
                  style={{ height: `${(day.score / MAX_SCORE) * 100}%` }}
                />
              ) : (
                <span className="h-0.5 w-full rounded-t-sm bg-border" />
              )}
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-sm group-hover:block">
                {dayFormat.format(parseLocalDate(date))}
                {moods.length > 0 && ` · ${moods.map((mood) => mood.emoji).join('')}`}
                {day?.score ? ` · ${day.score}/10` : ''}
              </span>
            </button>
          )
        })}
      </div>
      <ul className="sr-only">
        {dates.map((date) => {
          const day = days.get(date)
          return (
            <li key={date}>
              {dayFormat.format(parseLocalDate(date))}: {day?.score ? t('journal.scoreOf', { score: day.score }) : t('journal.noScore')}
              {moodsOf(day).map((mood) => `, ${mood.label}`).join('')}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
