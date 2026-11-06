import { useDeferredValue, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Plus, Sparkles } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { localDate } from '@/lib/dates'
import { CaptureStatus } from '@/components/zen/CaptureStatus'
import { useCaptures } from '@/components/zen/useCaptures'
import * as api from './api'
import { LIBRARY_KEY, marksByName, type Note, type NoteFilter } from './api'
import { DailyRange } from './DailyRange'
import { DiaryFilters } from './DiaryFilters'
import { NoteDialog } from './NoteDialog'
import { NoteDays, NoteList } from './NoteList'
import { useNoteActions } from './useNoteActions'

type Editing = { note: Note | null } | null

export function DiaryLibrary() {
  const { save, saveFailed, saveNote, removeNote } = useNoteActions()
  const [params] = useSearchParams()
  const [filter, setFilter] = useState<NoteFilter>(params.has('daily') ? { daily: 'true' } : {})
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Editing>(null)
  const query = useDeferredValue(search.trim())
  const { active, failed } = useCaptures({
    queryKey: api.CAPTURES_KEY,
    fetchCaptures: api.fetchCaptures,
    resultKey: LIBRARY_KEY,
    doneMessage: 'Запись в дневнике',
    failedMessage: 'Не удалось разобрать запись. Текст сохранён.',
  })

  const notes = useQuery({
    queryKey: [...LIBRARY_KEY, 'notes', filter, query],
    queryFn: () => api.fetchNotes({ ...filter, q: query }),
    placeholderData: keepPreviousData,
  })
  const allNotes = useQuery({ queryKey: [...LIBRARY_KEY, 'notes', 'all'], queryFn: () => api.fetchNotes({}) })
  const folders = useQuery({ queryKey: [...LIBRARY_KEY, 'folders'], queryFn: api.fetchFolders })
  const tags = useQuery({ queryKey: [...LIBRARY_KEY, 'tags'], queryFn: api.fetchTags })

  const folderMarks = useMemo(() => marksByName(folders.data), [folders.data])
  const tagMarks = useMemo(() => marksByName(tags.data), [tags.data])

  const empty = !notes.isPending && !notes.isError && notes.data?.length === 0
  const filtered = Boolean(filter.folder || filter.tag || filter.from || filter.to || query)
  const Notes = filter.daily ? NoteDays : NoteList

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <DiaryFilters
        folders={folders.data ?? []}
        tags={tags.data ?? []}
        filter={filter}
        onChange={setFilter}
        onRenameFolder={(id, name) => save(() => api.updateFolder(id, { name }))}
        onFolderColor={(id, color) => save(() => api.updateFolder(id, { color }))}
        onFolderEmoji={(id, emoji) => save(() => api.updateFolder(id, { emoji }))}
        onDeleteFolder={(id) => save(() => api.deleteFolder(id))}
        onTagColor={(id, color) => save(() => api.updateTag(id, { color }))}
        onTagEmoji={(id, emoji) => save(() => api.updateTag(id, { emoji }))}
        onDeleteTag={(id) => save(() => api.deleteTag(id))}
      />

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-3 p-4">
          <div className="flex gap-2">
            <Input
              type="search"
              aria-label="Поиск по записям"
              placeholder="Поиск"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Button variant="outline" onClick={() => setEditing({ note: null })}>
              <Plus />
              Запись
            </Button>
          </div>

          {filter.daily && (
            <DailyRange
              from={filter.from}
              to={filter.to}
              onChange={(range) => setFilter({ ...filter, ...range })}
            />
          )}

          {saveFailed && (
            <p role="alert" className="text-sm text-destructive">
              Не удалось сохранить изменения.
            </p>
          )}
          <CaptureStatus
            active={active}
            failed={failed}
            activeLabel="Нейросеть разбирает записи"
            failedLabel="Не удалось разобрать запись, но текст сохранён."
            queryKey={api.CAPTURES_KEY}
            onRetry={api.retryCapture}
            onDelete={api.deleteCapture}
          />

          {notes.isPending && <p className="text-sm text-muted-foreground">Загружаем записи…</p>}
          {notes.isError && !notes.data && (
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm text-muted-foreground">Не удалось загрузить записи.</p>
              <Button variant="outline" size="sm" onClick={() => notes.refetch()}>
                Повторить
              </Button>
            </div>
          )}
          {empty &&
            (filtered ? (
              <p className="text-sm text-muted-foreground">Ничего не найдено.</p>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <p className="max-w-sm text-sm text-muted-foreground">
                  {filter.daily
                    ? 'Здесь будут записи о ваших днях. Расскажите в дзен-режиме, что вы сегодня делали, и нейросеть добавит запись сюда.'
                    : 'Записей пока нет. В дзен-режиме можно просто писать, а нейросеть сама разложит мысли по папкам и тегам.'}
                </p>
                <Button asChild>
                  <Link to="/diary/zen">
                    <Sparkles />
                    Открыть дзен-режим
                  </Link>
                </Button>
              </div>
            ))}
          {notes.data && (
            <Notes
              notes={notes.data}
              folderMarks={folderMarks}
              tagMarks={tagMarks}
              onOpen={(note) => setEditing({ note })}
            />
          )}
        </div>
      </div>

      {editing && (
        <NoteDialog
          key={editing.note?.id ?? 'new'}
          note={editing.note}
          defaultDailyDate={filter.daily ? localDate(new Date()) : undefined}
          folders={folders.data ?? []}
          allNotes={allNotes.data ?? []}
          onClose={() => setEditing(null)}
          onSave={(input) => saveNote(editing.note, input)}
          onDelete={() => {
            if (editing.note) removeNote(editing.note)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
