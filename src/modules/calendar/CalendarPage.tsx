import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import * as api from './api'
import { CALENDAR_KEY, type CalendarNote } from './api'
import { CalendarGrid, type View } from './CalendarGrid'
import { addDays, addMonths, formatMonth, formatWeek, fromKey, monthDays, toKey, weekDays } from './dates'
import { DayPanel } from './DayPanel'
import { NoteDialog } from './NoteDialog'

const VIEWS: { value: View; label: string }[] = [
  { value: 'month', label: 'Месяц' },
  { value: 'week', label: 'Неделя' },
]

function groupByDate<Item extends { date: string }>(items: Item[]) {
  const groups = new Map<string, Item[]>()
  for (const item of items) {
    groups.set(item.date, [...(groups.get(item.date) ?? []), item])
  }
  return groups
}

type Editing = { note: CalendarNote | null } | null

export default function CalendarPage() {
  const queryClient = useQueryClient()
  const [todayKey] = useState(() => toKey(new Date()))
  const [view, setView] = useState<View>('month')
  const [anchor, setAnchor] = useState(() => new Date())
  const [selected, setSelected] = useState(todayKey)
  const [editing, setEditing] = useState<Editing>(null)

  const days = useMemo(() => (view === 'month' ? monthDays(anchor) : weekDays(anchor)), [anchor, view])
  const from = toKey(days[0])
  const to = toKey(days[days.length - 1])

  const { data, isError, refetch } = useQuery({
    queryKey: [...CALENDAR_KEY, from, to],
    queryFn: () => api.fetchRange(from, to),
    placeholderData: keepPreviousData,
  })

  const { mutate: save, isError: saveFailed } = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: CALENDAR_KEY })
    },
  })

  const notesByDay = useMemo(() => groupByDate(data?.notes ?? []), [data])
  const tasksByDay = useMemo(() => groupByDate(data?.tasks ?? []), [data])

  function step(direction: 1 | -1) {
    const next = view === 'month' ? addMonths(anchor, direction) : addDays(anchor, 7 * direction)
    setAnchor(next)
    setSelected(toKey(next))
  }

  function goToday() {
    setAnchor(fromKey(todayKey))
    setSelected(todayKey)
  }

  function selectDay(key: string) {
    setSelected(key)
    // A day from a neighboring month brings that month into view.
    if (view === 'month' && fromKey(key).getMonth() !== anchor.getMonth()) setAnchor(fromKey(key))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto xl:flex-row xl:overflow-hidden">
      <div className="flex min-w-0 flex-col gap-3 p-4 xl:flex-1 xl:overflow-y-auto">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Назад" onClick={() => step(-1)}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" aria-label="Вперёд" onClick={() => step(1)}>
            <ChevronRight />
          </Button>
          <Button variant="outline" onClick={goToday}>
            Сегодня
          </Button>
          <h2 className="text-base font-medium">{view === 'month' ? formatMonth(anchor) : formatWeek(days)}</h2>
          <div role="group" aria-label="Вид календаря" className="ml-auto flex gap-1">
            {VIEWS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                onClick={() => setView(value)}
                className={cn(
                  'rounded-md px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring max-lg:py-1.5',
                  view === value ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {saveFailed && (
          <p role="alert" className="text-sm text-destructive">
            Не удалось сохранить изменения.
          </p>
        )}
        {isError && (
          <div role="alert" className="flex items-center gap-3 text-sm text-destructive">
            Не удалось загрузить календарь.
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Повторить
            </Button>
          </div>
        )}

        <CalendarGrid
          days={days}
          view={view}
          month={anchor.getMonth()}
          todayKey={todayKey}
          selected={selected}
          notesByDay={notesByDay}
          tasksByDay={tasksByDay}
          onSelect={selectDay}
        />
      </div>

      <DayPanel
        date={selected}
        notes={notesByDay.get(selected) ?? []}
        tasks={tasksByDay.get(selected) ?? []}
        onQuickAdd={(title) =>
          save(() => api.createNote({ date: selected, time: null, title, body: '', color: 'blue' }))
        }
        onOpenNote={(note) => setEditing({ note })}
        onNewNote={() => setEditing({ note: null })}
      />

      {editing && (
        <NoteDialog
          key={editing.note?.id ?? 'new'}
          note={editing.note}
          date={selected}
          onClose={() => setEditing(null)}
          onSave={(input) => {
            const { note } = editing
            save(() => (note ? api.updateNote(note.id, input) : api.createNote(input)))
          }}
          onDelete={() => {
            const { note } = editing
            if (note) save(() => api.deleteNote(note.id))
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
