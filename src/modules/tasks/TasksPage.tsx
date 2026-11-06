import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useSearchParams } from 'react-router'

import { ModeTabs } from '@/components/ModeTabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CaptureStatus } from '@/components/zen/CaptureStatus'
import { useCaptures } from '@/components/zen/useCaptures'
import * as api from './api'
import { BOARD_QUERY_KEY, fetchBoard, type CardInput, type Column } from './api'
import { isOverdue, PRIORITIES, PRIORITY_LABELS, type Priority } from './appearance'
import { filterColumns, findCard, isFiltering, type TaskFilter } from './board-state'
import { CardDialog } from './CardDialog'
import { KanbanBoard } from './KanbanBoard'
import { TaskList } from './TaskList'
import { TasksZen } from './TasksZen'

const LIST_PATH = '/tasks/list'
const ZEN_PATH = '/tasks/zen'
const TABS = [
  { to: '/tasks', label: 'Канбан' },
  { to: LIST_PATH, label: 'Список' },
  { to: ZEN_PATH, label: 'Дзен' },
]

function Tasks({ columns }: { columns: Column[] }) {
  const queryClient = useQueryClient()
  const { pathname } = useLocation()
  const [filter, setFilter] = useState<TaskFilter>({ query: '', priority: 'all' })
  // ?card=<id> opens a card directly, for links from the calendar.
  const [searchParams, setSearchParams] = useSearchParams()
  const [openCardId, setOpenCardId] = useState(() => searchParams.get('card'))

  const { mutate: save, isError: saveFailed } = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    // Not returned: a failed save must report at once, not after refetch retries.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: BOARD_QUERY_KEY })
    },
  })

  const captures = useCaptures({
    queryKey: api.CAPTURES_KEY,
    fetchCaptures: api.fetchCaptures,
    resultKey: BOARD_QUERY_KEY,
    doneMessage: 'Задачи добавлены на доску',
    failedMessage: 'Не удалось создать задачи. Текст сохранён на вкладке «Канбан».',
  })

  const showList = pathname === LIST_PATH
  const showZen = pathname === ZEN_PATH
  const filtering = isFiltering(filter)
  const visibleColumns = useMemo(() => filterColumns(columns, filter), [columns, filter])
  const allCards = columns.flatMap((column) => column.cards)
  const overdue = allCards.filter((card) => isOverdue(card.dueDate)).length
  const openCard = openCardId ? findCard(columns, openCardId) : undefined

  function closeCard() {
    setOpenCardId(null)
    if (searchParams.has('card')) setSearchParams({}, { replace: true })
  }

  function saveCard(cardId: string, input: CardInput, fromColumn: string, toColumn: string) {
    save(async () => {
      await api.updateCard(cardId, input)
      // The server clamps the index, so this places the card at the end.
      if (fromColumn !== toColumn) await api.moveCard(cardId, toColumn, Number.MAX_SAFE_INTEGER)
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ModeTabs label="Вид задач" tabs={TABS} />

      {saveFailed && (
        <p role="alert" className="border-b bg-destructive/10 px-4 py-2 text-sm text-destructive">
          Не удалось сохранить изменения. Показано последнее сохранённое состояние.
        </p>
      )}

      {(captures.active > 0 || captures.failed.length > 0) && !showZen && (
        <div className="shrink-0 border-b px-4 py-2">
          <CaptureStatus
            active={captures.active}
            failed={captures.failed}
            activeLabel="Нейросеть создаёт задачи"
            failedLabel="Не удалось создать задачи, но текст сохранён."
            queryKey={api.CAPTURES_KEY}
            onRetry={api.retryCapture}
            onDelete={api.deleteCapture}
          />
        </div>
      )}

      {!showZen && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-4 py-2">
          <Input
            type="search"
            aria-label="Поиск по задачам"
            placeholder="Поиск по задачам"
            className="h-8 w-full sm:w-56"
            value={filter.query}
            onChange={(event) => setFilter({ ...filter, query: event.target.value })}
          />
          <select
            aria-label="Фильтр по приоритету"
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={filter.priority}
            onChange={(event) => setFilter({ ...filter, priority: event.target.value as Priority | 'all' })}
          >
            <option value="all">Все приоритеты</option>
            {PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {PRIORITY_LABELS[value]}
              </option>
            ))}
          </select>
          <p className="ml-auto text-xs text-muted-foreground">
            {filtering && !showList ? 'При фильтре перетаскивание отключено · ' : ''}
            Задач: {allCards.length}
            {overdue > 0 && <span className="text-destructive"> · просрочено: {overdue}</span>}
          </p>
        </div>
      )}

      {showZen ? (
        <TasksZen active={captures.active} />
      ) : showList ? (
        <TaskList
          columns={visibleColumns}
          onAddCard={(columnId, title) => save(() => api.createCard(columnId, title))}
          onOpenCard={(card) => setOpenCardId(card.id)}
        />
      ) : (
        <KanbanBoard columns={columns} filter={filter} save={save} onOpenCard={(card) => setOpenCardId(card.id)} />
      )}

      {openCard && (
        <CardDialog
          key={openCard.id}
          card={openCard}
          columns={columns}
          onClose={closeCard}
          onSave={(input, columnId) => saveCard(openCard.id, input, openCard.columnId, columnId)}
          onDelete={() => {
            save(() => api.deleteCard(openCard.id))
            closeCard()
          }}
        />
      )}
    </div>
  )
}

export default function TasksPage() {
  const { data, isPending, refetch } = useQuery({ queryKey: BOARD_QUERY_KEY, queryFn: fetchBoard })

  // A failed background refresh keeps the last loaded tasks on screen.
  if (data) {
    return <Tasks columns={data.columns} />
  }
  if (isPending) {
    return <p className="p-6 text-sm text-muted-foreground">Загружаем задачи…</p>
  }
  return (
    <div className="flex flex-col items-start gap-3 p-6">
      <p className="text-sm text-muted-foreground">Не удалось загрузить задачи.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>
        Повторить
      </Button>
    </div>
  )
}
