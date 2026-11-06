import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api'
import { localDate, parseLocalDate, weekLabel, weekStart } from '@/lib/dates'
import * as api from './api'
import { LIBRARY_KEY, marksByName, SUMMARIES_KEY, type Note } from './api'
import { DailyRange } from './DailyRange'
import { DayDialog } from './DayDialog'
import { DiaryRetrospective } from './DiaryRetrospective'
import { NoteDialog } from './NoteDialog'
import { NoteDays } from './NoteList'
import { isWorking, SummaryCard } from './SummaryCard'
import { useDays } from './useDays'
import { useNoteActions } from './useNoteActions'

const POLL_INTERVAL_MS = 2_000

type Editing = { note: Note | null } | null

function lastWeekStart() {
  const today = new Date()
  return weekStart(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7))
}

function groupByWeek(notes: Note[]) {
  const weeks = new Map<string, Note[]>()
  for (const note of notes) {
    if (!note.dailyDate) continue
    const week = weekStart(parseLocalDate(note.dailyDate))
    weeks.set(week, [...(weeks.get(week) ?? []), note])
  }
  return weeks
}

// The days of a life, newest first, each week opened by its summary.
export function DiaryJournal() {
  const queryClient = useQueryClient()
  const { saveFailed, saveNote, removeNote } = useNoteActions()
  const [range, setRange] = useState<{ from?: string; to?: string }>({})
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Editing>(null)
  const [openDay, setOpenDay] = useState<string | null>(null)
  const [lastWeek] = useState(lastWeekStart)
  const query = useDeferredValue(search.trim())
  const { byDate: days } = useDays()

  const notes = useQuery({
    queryKey: [...LIBRARY_KEY, 'notes', 'journal', range, query],
    queryFn: () => api.fetchNotes({ daily: 'true', ...range, q: query }),
    placeholderData: keepPreviousData,
  })
  const allNotes = useQuery({ queryKey: [...LIBRARY_KEY, 'notes', 'all'], queryFn: () => api.fetchNotes({}) })
  const folders = useQuery({ queryKey: [...LIBRARY_KEY, 'folders'], queryFn: api.fetchFolders })
  const tags = useQuery({ queryKey: [...LIBRARY_KEY, 'tags'], queryFn: api.fetchTags })
  const summaries = useQuery({
    queryKey: SUMMARIES_KEY,
    queryFn: api.fetchSummaries,
    refetchInterval: (state) => (state.state.data?.some(isWorking) ? POLL_INTERVAL_MS : false),
  })

  const summarize = useMutation({
    mutationFn: (week: string) => api.requestSummary(week, true),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUMMARIES_KEY }),
    onError: (error) =>
      toast.error(
        error instanceof ApiError && error.status === 409
          ? 'За эту неделю записей пока нет'
          : 'Не удалось подвести итоги',
      ),
  })

  const removeSummary = useMutation({
    mutationFn: api.deleteSummary,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUMMARIES_KEY }),
    onError: () => toast.error('Не удалось удалить итоги'),
  })

  // The finished week is summed up by itself. Opening this tab is what asks for
  // it, so an account nobody uses spends nothing on the model. A week without
  // notes is refused, and that needs no message.
  useEffect(() => {
    api
      .requestSummary(lastWeek, false)
      .then(() => queryClient.invalidateQueries({ queryKey: SUMMARIES_KEY }))
      .catch(() => {})
  }, [lastWeek, queryClient])

  const folderMarks = useMemo(() => marksByName(folders.data), [folders.data])
  const tagMarks = useMemo(() => marksByName(tags.data), [tags.data])
  const weekNotes = useMemo(() => groupByWeek(notes.data ?? []), [notes.data])
  const weekSummaries = useMemo(
    () => new Map((summaries.data ?? []).map((summary) => [summary.week, summary])),
    [summaries.data],
  )

  const filtered = Boolean(range.from || range.to || query)
  // A summary also covers ordinary notes, so its week can have no daily ones.
  const weeks = [...new Set([...weekNotes.keys(), ...(filtered ? [] : weekSummaries.keys())])].sort().reverse()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
        <DiaryRetrospective onOpenDay={setOpenDay} />

        <div className="flex gap-2">
          <Input
            type="search"
            aria-label="Поиск по ежедневнику"
            placeholder="Поиск"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button variant="outline" onClick={() => setEditing({ note: null })}>
            <Plus />
            Запись
          </Button>
        </div>
        <DailyRange from={range.from} to={range.to} onChange={setRange} />

        {saveFailed && (
          <p role="alert" className="text-sm text-destructive">
            Не удалось сохранить изменения.
          </p>
        )}
        {notes.isPending && <p className="text-sm text-muted-foreground">Загружаем дни…</p>}
        {notes.isError && !notes.data && (
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm text-muted-foreground">Не удалось загрузить дни.</p>
            <Button variant="outline" size="sm" onClick={() => notes.refetch()}>
              Повторить
            </Button>
          </div>
        )}
        {notes.data && weeks.length === 0 &&
          (filtered ? (
            <p className="text-sm text-muted-foreground">Ничего не найдено.</p>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="max-w-sm text-sm text-muted-foreground">
                Здесь будут ваши дни и итоги недель. Расскажите в дзен-режиме, что вы сегодня делали, и нейросеть добавит
                запись сюда.
              </p>
              <Button asChild variant="outline">
                <Link to="/diary/zen">Открыть дзен-режим</Link>
              </Button>
            </div>
          ))}

        {weeks.map((week) => {
          const summary = weekSummaries.get(week)
          return (
            <section key={week} aria-label={weekLabel(week)} className="flex flex-col gap-4 pt-2">
              {summary ? (
                <SummaryCard
                  summary={summary}
                  onRedo={() => summarize.mutate(week)}
                  onDelete={() => removeSummary.mutate(summary.id)}
                />
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xs text-muted-foreground">{weekLabel(week)}</h2>
                  <Button variant="ghost" size="xs" disabled={summarize.isPending} onClick={() => summarize.mutate(week)}>
                    <Sparkles />
                    Подвести итоги недели
                  </Button>
                </div>
              )}
              <NoteDays
                notes={weekNotes.get(week) ?? []}
                folderMarks={folderMarks}
                tagMarks={tagMarks}
                days={days}
                onOpenDay={setOpenDay}
                onOpen={(note) => setEditing({ note })}
              />
            </section>
          )
        })}
      </div>

      {openDay && <DayDialog date={openDay} onClose={() => setOpenDay(null)} />}

      {editing && (
        <NoteDialog
          key={editing.note?.id ?? 'new'}
          note={editing.note}
          defaultDailyDate={localDate(new Date())}
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
