import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { parseLocalDate } from '@/lib/dates'
import * as api from './api'
import { colorsByName, LIBRARY_KEY, type Note } from './api'
import { NoteDialog } from './NoteDialog'
import { NoteList } from './NoteList'
import { useNoteActions } from './useNoteActions'

const dayFormat = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function groupByDay(notes: Note[]) {
  const days = new Map<string, Note[]>()
  for (const note of notes) {
    if (note.dailyDate) days.set(note.dailyDate, [...(days.get(note.dailyDate) ?? []), note])
  }
  return [...days]
}

// The daily notes as a journal, newest day first.
export function DiaryDays() {
  const { saveFailed, saveNote, removeNote } = useNoteActions()
  const [opened, setOpened] = useState<Note | null>(null)

  const daily = useQuery({
    queryKey: [...LIBRARY_KEY, 'notes', 'daily'],
    queryFn: () => api.fetchNotes({ daily: 'true' }),
  })
  const allNotes = useQuery({ queryKey: [...LIBRARY_KEY, 'notes', 'all'], queryFn: () => api.fetchNotes({}) })
  const folders = useQuery({ queryKey: [...LIBRARY_KEY, 'folders'], queryFn: api.fetchFolders })
  const tags = useQuery({ queryKey: [...LIBRARY_KEY, 'tags'], queryFn: api.fetchTags })

  const days = useMemo(() => groupByDay(daily.data ?? []), [daily.data])
  const folderColors = useMemo(() => colorsByName(folders.data), [folders.data])
  const tagColors = useMemo(() => colorsByName(tags.data), [tags.data])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
        {saveFailed && (
          <p role="alert" className="text-sm text-destructive">
            Не удалось сохранить изменения.
          </p>
        )}
        {daily.isError && <p className="text-sm text-muted-foreground">Не удалось загрузить дни.</p>}
        {daily.data?.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="max-w-sm text-sm text-muted-foreground">
              Здесь будут записи о ваших днях. Расскажите в дзен-режиме, что вы сегодня делали, и нейросеть добавит
              запись сюда.
            </p>
            <Button asChild variant="outline">
              <Link to="/diary/zen">Открыть дзен-режим</Link>
            </Button>
          </div>
        )}
        {days.map(([day, notes]) => (
          <section key={day} aria-label={day} className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">{capitalize(dayFormat.format(parseLocalDate(day)))}</h2>
            <NoteList notes={notes} folderColors={folderColors} tagColors={tagColors} fullText onOpen={setOpened} />
          </section>
        ))}
      </div>

      {opened && (
        <NoteDialog
          key={opened.id}
          note={opened}
          folders={folders.data ?? []}
          allNotes={allNotes.data ?? []}
          onClose={() => setOpened(null)}
          onSave={(input) => saveNote(opened, input)}
          onDelete={() => {
            removeNote(opened)
            setOpened(null)
          }}
        />
      )}
    </div>
  )
}
