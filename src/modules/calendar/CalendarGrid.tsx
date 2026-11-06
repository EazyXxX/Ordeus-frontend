import { CheckSquare } from 'lucide-react'

import { COLOR_DOT, type Color } from '@/lib/colors'
import { cn } from '@/lib/utils'
import type { CalendarNote, CalendarTask } from './api'
import { toKey } from './dates'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTH_CELL_ITEMS = 3

export type View = 'month' | 'week'

type ChipProps = {
  label: string
  color: Color
  task?: boolean
}

function Chip({ label, color, task }: ChipProps) {
  return (
    <span className="flex min-w-0 items-center gap-1 rounded-sm bg-muted/70 px-1 py-0.5 text-xs">
      {task ? (
        <CheckSquare className="size-3 shrink-0 text-muted-foreground" aria-hidden />
      ) : (
        <span className={cn('size-2 shrink-0 rounded-full', COLOR_DOT[color])} aria-hidden />
      )}
      <span className="truncate">{label}</span>
    </span>
  )
}

type DayCellProps = {
  day: Date
  view: View
  outside: boolean
  today: boolean
  selected: boolean
  notes: CalendarNote[]
  tasks: CalendarTask[]
  onSelect: () => void
}

function DayCell({ day, view, outside, today, selected, notes, tasks, onSelect }: DayCellProps) {
  const total = notes.length + tasks.length
  const limit = view === 'month' ? MONTH_CELL_ITEMS : total
  const items = [
    ...tasks.map((task) => ({ id: task.id, label: task.title, color: task.color || task.columnColor, task: true })),
    ...notes.map((note) => ({
      id: note.id,
      label: note.time ? `${note.time} ${note.title}` : note.title,
      color: note.color,
      task: false,
    })),
  ]
  const visible = items.slice(0, total > limit ? limit - 1 : limit)
  const hidden = total - visible.length
  const week = view === 'week'

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${day.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}, записей: ${total}`}
      onClick={onSelect}
      className={cn(
        'flex min-w-0 flex-col gap-1 border-r border-b bg-background p-1 text-left outline-none hover:bg-muted/30 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring',
        // A phone is too narrow for seven columns, so a week becomes a list of days.
        week ? 'min-h-14 max-md:flex-row max-md:gap-2 md:min-h-64' : 'min-h-14 md:min-h-24',
        outside && 'bg-muted/20 text-muted-foreground',
        selected && 'bg-accent hover:bg-accent',
      )}
    >
      <span className={cn('flex shrink-0 flex-col items-center gap-0.5 md:self-start', !week && 'self-center', week && 'max-md:w-9')}>
        {week && <span className="text-xs text-muted-foreground md:hidden">{WEEKDAYS[(day.getDay() + 6) % 7]}</span>}
        <span
          className={cn(
            'flex size-6 items-center justify-center rounded-full text-xs',
            today && 'bg-primary font-medium text-primary-foreground',
          )}
        >
          {day.getDate()}
        </span>
      </span>
      <span className={cn('min-w-0 flex-col gap-0.5', week ? 'flex flex-1' : 'hidden md:flex')}>
        {visible.map((item) => (
          <Chip key={item.id} label={item.label} color={item.color} task={item.task} />
        ))}
        {hidden > 0 && <span className="px-1 text-xs text-muted-foreground">ещё {hidden}</span>}
      </span>
      {total > 0 && !week && (
        <span className="flex flex-wrap justify-center gap-0.5 md:hidden" aria-hidden>
          {items.slice(0, 4).map((item) => (
            <span key={item.id} className={cn('size-1.5 rounded-full', COLOR_DOT[item.color])} />
          ))}
        </span>
      )}
    </button>
  )
}

type CalendarGridProps = {
  days: Date[]
  view: View
  month: number
  todayKey: string
  selected: string
  notesByDay: Map<string, CalendarNote[]>
  tasksByDay: Map<string, CalendarTask[]>
  onSelect: (key: string) => void
}

export function CalendarGrid({
  days,
  view,
  month,
  todayKey,
  selected,
  notesByDay,
  tasksByDay,
  onSelect,
}: CalendarGridProps) {
  return (
    <div className="flex flex-col border-t border-l">
      <div className={cn('grid grid-cols-7', view === 'week' && 'max-md:hidden')}>
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="border-r border-b px-1 py-1 text-center text-xs font-medium text-muted-foreground">
            {weekday}
          </div>
        ))}
      </div>
      <div className={cn('grid md:grid-cols-7', view === 'month' ? 'grid-cols-7' : 'grid-cols-1')}>
        {days.map((day) => {
          const key = toKey(day)
          return (
            <DayCell
              key={key}
              day={day}
              view={view}
              outside={view === 'month' && day.getMonth() !== month}
              today={key === todayKey}
              selected={key === selected}
              notes={notesByDay.get(key) ?? []}
              tasks={tasksByDay.get(key) ?? []}
              onSelect={() => onSelect(key)}
            />
          )
        })}
      </div>
    </div>
  )
}
