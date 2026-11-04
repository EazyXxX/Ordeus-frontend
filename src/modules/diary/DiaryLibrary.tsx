import { useDeferredValue, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Plus, Sparkles } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as api from './api'
import { colorsByName, LIBRARY_KEY, type Note, type NoteFilter } from './api'
import { CaptureStatus } from './CaptureStatus'
import { DiaryFilters } from './DiaryFilters'
import { NoteDialog } from './NoteDialog'
import { NoteList } from './NoteList'
import { useCaptures } from './useCaptures'
import { useNoteActions } from './useNoteActions'

type Editing = { note: Note | null } | null

export function DiaryLibrary() {
  const { save, saveFailed, saveNote, removeNote } = useNoteActions()
  const [filter, setFilter] = useState<NoteFilter>({})
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Editing>(null)
  const query = useDeferredValue(search.trim())
  const { active, failed } = useCaptures()

  const notes = useQuery({
    queryKey: [...LIBRARY_KEY, 'notes', filter, query],
    queryFn: () => api.fetchNotes({ ...filter, q: query }),
    placeholderData: keepPreviousData,
  })
  const allNotes = useQuery({ queryKey: [...LIBRARY_KEY, 'notes', 'all'], queryFn: () => api.fetchNotes({}) })
  const folders = useQuery({ queryKey: [...LIBRARY_KEY, 'folders'], queryFn: api.fetchFolders })
  const tags = useQuery({ queryKey: [...LIBRARY_KEY, 'tags'], queryFn: api.fetchTags })

  const folderColors = useMemo(() => colorsByName(folders.data), [folders.data])
  const tagColors = useMemo(() => colorsByName(tags.data), [tags.data])

  const empty = !notes.isPending && !notes.isError && notes.data?.length === 0
  const filtered = Boolean(filter.folder || filter.tag || query)

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <DiaryFilters
        folders={folders.data ?? []}
        tags={tags.data ?? []}
        filter={filter}
        onChange={setFilter}
        onRenameFolder={(id, name) => save(() => api.updateFolder(id, { name }))}
        onFolderColor={(id, color) => save(() => api.updateFolder(id, { color }))}
        onDeleteFolder={(id) => save(() => api.deleteFolder(id))}
        onTagColor={(id, color) => save(() => api.updateTagColor(id, color))}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
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

        {saveFailed && (
          <p role="alert" className="text-sm text-destructive">
            Не удалось сохранить изменения.
          </p>
        )}
        <CaptureStatus active={active} failed={failed} />

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
                Записей пока нет. В дзен-режиме можно просто писать, а нейросеть сама разложит мысли по папкам и тегам.
              </p>
              <Button asChild>
                <Link to="/diary/zen">
                  <Sparkles />
                  Открыть дзен-режим
                </Link>
              </Button>
            </div>
          ))}
        {notes.data && <NoteList
            notes={notes.data}
            folderColors={folderColors}
            tagColors={tagColors}
            onOpen={(note) => setEditing({ note })}
          />}
      </div>

      {editing && (
        <NoteDialog
          key={editing.note?.id ?? 'new'}
          note={editing.note}
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
