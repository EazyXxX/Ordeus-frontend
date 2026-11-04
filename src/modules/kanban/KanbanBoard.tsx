import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import * as api from './api'
import { BOARD_QUERY_KEY } from './api'
import type { CardInput, Column } from './api'
import { cardClass, isOverdue, PRIORITIES, PRIORITY_LABELS, type Priority } from './appearance'
import { cardIndex, findCard, findCardColumn, placeCard } from './board-state'
import { CardDialog } from './CardDialog'
import { CardContent } from './cardFace'
import { InlineAdd } from './InlineAdd'
import { KanbanColumn } from './KanbanColumn'

const typeOf = (args: Parameters<CollisionDetection>[0], id: UniqueIdentifier) =>
  args.droppableContainers.find((container) => container.id === id)?.data.current?.type

// Columns only compete with columns. A dragged card prefers the card under the
// pointer and falls back to the column around it, so empty columns accept drops.
const detectCollisions: CollisionDetection = (args) => {
  if (args.active.data.current?.type === 'column') {
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter((container) => container.data.current?.type === 'column'),
    })
  }
  const pointerHits = pointerWithin(args)
  const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(args)
  const cardHits = hits.filter((hit) => typeOf(args, hit.id) === 'card')
  return cardHits.length > 0 ? cardHits : hits
}

export function KanbanBoard({ columns: savedColumns }: { columns: Column[] }) {
  const queryClient = useQueryClient()
  // While dragging, the board renders this copy, so a card can visibly change
  // columns before anything is saved.
  const [draft, setDraft] = useState<Column[] | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  // ?card=<id> opens a card directly, for links from the calendar.
  const [searchParams, setSearchParams] = useSearchParams()
  const [openCardId, setOpenCardId] = useState(() => searchParams.get('card'))
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState<Priority | 'all'>('all')

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] },
    }),
  )

  const { mutate: save, isError: saveFailed } = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    // Not returned: a failed save must report at once, not after refetch retries.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: BOARD_QUERY_KEY })
    },
  })

  const columns = draft ?? savedColumns
  const query = search.trim().toLowerCase()
  // Order is saved by position in the whole column, so dragging a filtered,
  // partial list could not place a card correctly.
  const filtering = query !== '' || priority !== 'all'
  const visibleColumns = useMemo(() => {
    if (!filtering) return columns
    return columns.map((column) => ({
      ...column,
      cards: column.cards.filter(
        (card) =>
          (priority === 'all' || card.priority === priority) &&
          `${card.title} ${card.description}`.toLowerCase().includes(query),
      ),
    }))
  }, [columns, filtering, priority, query])

  const allCards = columns.flatMap((column) => column.cards)
  const overdue = allCards.filter((card) => isOverdue(card.dueDate)).length
  const openCard = openCardId ? findCard(columns, openCardId) : undefined
  const activeCard = activeId ? findCard(columns, activeId) : undefined
  const activeColumn = columns.find((column) => column.id === activeId)

  function finishDrag(next: Column[] | null, action?: () => Promise<unknown>) {
    if (next && action) {
      void queryClient.cancelQueries({ queryKey: BOARD_QUERY_KEY })
      queryClient.setQueryData(BOARD_QUERY_KEY, { columns: next })
      save(action, {
        onError: () => queryClient.setQueryData(BOARD_QUERY_KEY, { columns: savedColumns }),
      })
    }
    setDraft(null)
    setActiveId(null)
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id))
    setDraft(savedColumns)
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || active.data.current?.type !== 'card') return
    const cardId = String(active.id)
    const overId = String(over.id)
    const overColumn = over.data.current?.type === 'column'

    setDraft((current) => {
      if (!current) return current
      const source = findCardColumn(current, cardId)
      const target = overColumn ? current.find((column) => column.id === overId) : findCardColumn(current, overId)
      if (!source || !target || source.id === target.id) return current
      const index = overColumn ? target.cards.length : cardIndex(target, overId)
      return placeCard(current, cardId, target.id, index)
    })
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!draft || !over) return finishDrag(null)
    const id = String(active.id)
    const overId = String(over.id)

    if (active.data.current?.type === 'column') {
      const from = draft.findIndex((column) => column.id === id)
      const to = draft.findIndex((column) => column.id === overId)
      if (from === to || to < 0) return finishDrag(null)
      return finishDrag(arrayMove(draft, from, to), () => api.moveColumn(id, to))
    }

    const target = findCardColumn(draft, id)
    const original = findCardColumn(savedColumns, id)
    if (!target || !original) return finishDrag(null)
    const overIndex = cardIndex(target, overId)
    const index = overIndex >= 0 ? overIndex : cardIndex(target, id)
    if (target.id === original.id && index === cardIndex(original, id)) return finishDrag(null)
    finishDrag(placeCard(draft, id, target.id, index), () => api.moveCard(id, target.id, index))
  }

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
    <DndContext
      sensors={sensors}
      collisionDetection={detectCollisions}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => finishDrag(null)}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {saveFailed && (
          <p role="alert" className="border-b bg-destructive/10 px-4 py-2 text-sm text-destructive">
            Не удалось сохранить изменения. Показано последнее сохранённое состояние доски.
          </p>
        )}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-4 py-2">
          <Input
            type="search"
            aria-label="Поиск по карточкам"
            placeholder="Поиск по карточкам"
            className="h-8 w-full sm:w-56"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            aria-label="Фильтр по приоритету"
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority | 'all')}
          >
            <option value="all">Все приоритеты</option>
            {PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {PRIORITY_LABELS[value]}
              </option>
            ))}
          </select>
          <p className="ml-auto text-xs text-muted-foreground">
            {filtering ? 'При фильтре перетаскивание отключено · ' : ''}
            Карточек: {allCards.length}
            {overdue > 0 && <span className="text-destructive"> · просрочено: {overdue}</span>}
          </p>
        </div>
        <div className="flex min-h-0 flex-1 items-start gap-3 overflow-x-auto p-4">
          <SortableContext items={visibleColumns.map((column) => column.id)} strategy={horizontalListSortingStrategy}>
            {visibleColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                totalCards={columns.find(({ id }) => id === column.id)?.cards.length ?? 0}
                dragDisabled={filtering}
                onAddCard={(title) => save(() => api.createCard(column.id, title))}
                onOpenCard={(card) => setOpenCardId(card.id)}
                onRename={(title) => save(() => api.updateColumn(column.id, { title }))}
                onColorChange={(color) => save(() => api.updateColumn(column.id, { color }))}
                onDelete={() => save(() => api.deleteColumn(column.id))}
              />
            ))}
          </SortableContext>
          <div className="w-72 shrink-0">
            <InlineAdd
              label="Добавить колонку"
              placeholder="Название колонки"
              onSubmit={(title) => save(() => api.createColumn(title))}
            />
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeCard && (
          <div className={cn(cardClass(activeCard.color), 'rotate-1 cursor-grabbing shadow-lg')}>
            <CardContent card={activeCard} />
          </div>
        )}
        {activeColumn && (
          <div className="cursor-grabbing rounded-lg bg-muted p-3 text-sm font-medium shadow-lg">
            {activeColumn.title}
          </div>
        )}
      </DragOverlay>

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
    </DndContext>
  )
}
