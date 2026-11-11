import { useDeferredValue, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Plus, Sparkles } from 'lucide-react'
import { Link } from 'react-router'

import { t } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { localDate } from '@/lib/dates'
import { CaptureStatus } from '@/components/zen/CaptureStatus'
import { useCaptures } from '@/components/zen/useCaptures'
import * as api from './api'
import { LIBRARY_KEY, marksByName, type Note, type NoteFilter } from './api'
import { DiaryFilters } from './DiaryFilters'
import { NoteDialog } from './NoteDialog'
import { NoteList } from './NoteList'
import { useNoteActions } from './useNoteActions'

type Editing = { note: Note | null } | null

export function DiaryLibrary() {
  const { save, saveFailed, saveNote, removeNote } = useNoteActions()
  const [filter, setFilter] = useState<NoteFilter>({})
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Editing>(null)
  const query = useDeferredValue(search.trim())
  const { active, failed } = useCaptures({
    queryKey: api.CAPTURES_KEY,
    fetchCaptures: api.fetchCaptures,
    resultKey: LIBRARY_KEY,
    doneMessage: t('diary.noteSaved'),
    failedMessage: t('diary.organizeFailedShort'),
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
              aria-label={t('diary.searchNotes')}
              placeholder={t('common.search')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Button variant="outline" onClick={() => setEditing({ note: null })}>
              <Plus />
              {t('common.noteButton')}
            </Button>
          </div>

          {saveFailed && (
            <p role="alert" className="text-sm text-destructive">
              {t('common.saveFailed')}
            </p>
          )}
          <CaptureStatus
            active={active}
            failed={failed}
            activeLabel={t('diary.organizing')}
            failedLabel={t('diary.organizeFailedKept')}
            queryKey={api.CAPTURES_KEY}
            onRetry={api.retryCapture}
            onDelete={api.deleteCapture}
          />

          {notes.isPending && <p className="text-sm text-muted-foreground">{t('diary.loading')}</p>}
          {notes.isError && !notes.data && (
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm text-muted-foreground">{t('diary.loadFailed')}</p>
              <Button variant="outline" size="sm" onClick={() => notes.refetch()}>
                {t('common.retry')}
              </Button>
            </div>
          )}
          {empty &&
            (filtered ? (
              <p className="text-sm text-muted-foreground">{t('common.nothingFound')}</p>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <p className="max-w-sm text-sm text-muted-foreground">
                  {filter.daily
                    ? t('diary.emptyDaily')
                    : t('diary.empty')}
                </p>
                <Button asChild>
                  <Link to="/diary/zen">
                    <Sparkles />
                    {t('common.openZen')}
                  </Link>
                </Button>
              </div>
            ))}
          {notes.data && (
            <NoteList
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
          onSave={(input, images) => saveNote(editing.note, input, images)}
          onDelete={() => {
            if (editing.note) removeNote(editing.note)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
