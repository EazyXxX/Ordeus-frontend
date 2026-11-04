import { useState, type FormEvent } from 'react'
import { CheckSquare, Plus } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { COLOR_DOT } from '@/lib/colors'
import { cn } from '@/lib/utils'
import type { CalendarNote, CalendarTask } from './api'
import { formatDay, fromKey } from './dates'

type DayPanelProps = {
  date: string
  notes: CalendarNote[]
  tasks: CalendarTask[]
  onQuickAdd: (title: string) => void
  onOpenNote: (note: CalendarNote) => void
  onNewNote: () => void
}

export function DayPanel({ date, notes, tasks, onQuickAdd, onOpenNote, onNewNote }: DayPanelProps) {
  const [title, setTitle] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return
    onQuickAdd(title.trim())
    setTitle('')
  }

  return (
    <aside
      aria-label="Выбранный день"
      className="flex shrink-0 flex-col gap-4 border-t p-4 lg:w-80 lg:overflow-y-auto lg:border-t-0 lg:border-l"
    >
      <h2 className="text-sm font-medium">{formatDay(fromKey(date))}</h2>

      {tasks.length > 0 && (
        <section aria-label="Задачи" className="flex flex-col gap-1">
          <h3 className="text-xs font-medium text-muted-foreground">Задачи</h3>
          {tasks.map((task) => (
            <Link
              key={task.id}
              to={`/tasks?card=${task.id}`}
              className="flex items-center gap-2 rounded-md border p-2 text-sm outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CheckSquare className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{task.title}</span>
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <span className={cn('size-2 rounded-full', COLOR_DOT[task.columnColor])} aria-hidden />
                {task.columnTitle}
              </span>
            </Link>
          ))}
        </section>
      )}

      <section aria-label="Заметки" className="flex flex-col gap-1">
        <h3 className="text-xs font-medium text-muted-foreground">Заметки</h3>
        {notes.length === 0 && <p className="text-sm text-muted-foreground">На этот день заметок нет.</p>}
        {notes.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => onOpenNote(note)}
            className="flex items-start gap-2 rounded-md border p-2 text-left text-sm outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', COLOR_DOT[note.color])} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block break-words">
                {note.time && <span className="text-muted-foreground">{note.time} </span>}
                {note.title}
              </span>
              {note.body && (
                <span className="mt-0.5 line-clamp-2 block text-xs break-words whitespace-pre-wrap text-muted-foreground">
                  {note.body}
                </span>
              )}
            </span>
          </button>
        ))}
      </section>

      <form onSubmit={submit} className="flex gap-2">
        <Input
          aria-label="Новая заметка"
          placeholder="Новая заметка"
          maxLength={200}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Button type="button" variant="outline" size="icon" aria-label="Заметка с подробностями" onClick={onNewNote}>
          <Plus />
        </Button>
      </form>
    </aside>
  )
}
