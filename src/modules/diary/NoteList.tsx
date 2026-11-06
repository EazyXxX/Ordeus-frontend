import { CalendarDays, Link2, Sparkles } from 'lucide-react'

import { locale, t } from '@/i18n'
import { Badge } from '@/components/ui/badge'
import { parseLocalDate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { Day, Mark, Note } from './api'
import { DayMark } from './DayMark'
import { DaySummary } from './DaySummary'
import { LabelMark } from './LabelMark'

const dailyFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' })
const dayFormat = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const dateFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

type NoteListProps = {
  notes: Note[]
  folderMarks: Map<string, Mark>
  tagMarks: Map<string, Mark>
  // For notes under a day heading: whole text instead of a preview, and no date.
  journal?: boolean
  onOpen: (note: Note) => void
}

export function NoteList({ notes, folderMarks, tagMarks, journal, onOpen }: NoteListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {notes.map((note) => (
        <li key={note.id}>
          <button
            type="button"
            onClick={() => onOpen(note)}
            className="w-full rounded-lg border bg-card p-3 text-left outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="block text-sm font-medium break-words">{note.title}</span>
            <span
              className={cn(
                'mt-1 text-sm break-words whitespace-pre-wrap text-muted-foreground',
                journal ? 'block' : 'line-clamp-3',
              )}
            >
              {note.body}
            </span>
            <span className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {note.dailyDate && !journal && (
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <CalendarDays className="size-3" aria-hidden />
                  {dailyFormat.format(parseLocalDate(note.dailyDate))}
                </span>
              )}
              {note.folder && (
                <span className="flex items-center gap-1 font-medium">
                  <LabelMark mark={folderMarks.get(note.folder)} />
                  {note.folder}
                </span>
              )}
              {note.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  <LabelMark mark={tagMarks.get(tag)} />
                  {tag}
                </Badge>
              ))}
              {note.links.length > 0 && (
                <span className="flex items-center gap-1">
                  <Link2 className="size-3" aria-hidden />
                  {note.links.length}
                </span>
              )}
              {note.fromAi && <Sparkles className="size-3" aria-label={t('note.fromAi')} />}
              <span className="ml-auto">{dateFormat.format(new Date(note.createdAt))}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Daily notes under a heading for each day, in the order they arrive.
type NoteDaysProps = Omit<NoteListProps, 'journal'> & {
  days: Map<string, Day>
  onOpenDay: (date: string) => void
}

export function NoteDays({ notes, days: dayMarks, onOpenDay, ...list }: NoteDaysProps) {
  const days = new Map<string, Note[]>()
  for (const note of notes) {
    if (note.dailyDate) days.set(note.dailyDate, [...(days.get(note.dailyDate) ?? []), note])
  }

  return (
    <div className="flex flex-col gap-6">
      {[...days].map(([day, dayNotes]) => (
        <section key={day} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">{capitalize(dayFormat.format(parseLocalDate(day)))}</h2>
            <DayMark day={dayMarks.get(day)} onClick={() => onOpenDay(day)} />
          </div>
          <DaySummary date={day} day={dayMarks.get(day)} notes={dayNotes} />
          <NoteList {...list} notes={dayNotes} journal />
        </section>
      ))}
    </div>
  )
}
