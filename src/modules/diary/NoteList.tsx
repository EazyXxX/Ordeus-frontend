import { Link2, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { Note } from './api'

const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

export function NoteList({ notes, onOpen }: { notes: Note[]; onOpen: (note: Note) => void }) {
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
            <span className="mt-1 line-clamp-3 block text-sm break-words whitespace-pre-wrap text-muted-foreground">
              {note.body}
            </span>
            <span className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {note.folder && <span className="font-medium">{note.folder}</span>}
              {note.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
              {note.links.length > 0 && (
                <span className="flex items-center gap-1">
                  <Link2 className="size-3" aria-hidden />
                  {note.links.length}
                </span>
              )}
              {note.fromAi && <Sparkles className="size-3" aria-label="Разобрано нейросетью" />}
              <span className="ml-auto">{dateFormat.format(new Date(note.createdAt))}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
