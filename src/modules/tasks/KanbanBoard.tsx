import { useMemo, useState } from 'react'
import { useQueryClient, type UseMutateFunction } from '@tanstack/react-query'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
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

import { t } from '@/i18n'
import { cn } from '@/lib/utils'
import * as api from './api'
import { BOARD_QUERY_KEY, type Board, type Card, type Column } from './api'
import { cardClass } from './appearance'
import { cardIndex, filterColumns, findCard, findCardColumn, isFiltering, placeCard, type TaskFilter } from './board-state'
import { CardContent } from './cardFace'
import { savedIndex, useTaskCategories, type CardSort } from './categories'
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

// A moved card changes the height of its columns, so their sizes go stale at once.
const MEASURING = { droppable: { strategy: MeasuringStrategy.Always } }

type KanbanBoardProps = {
  columns: Column[]
  filter: TaskFilter
  sort: CardSort
  save: UseMutateFunction<unknown, Error, () => Promise<unknown>>
  onOpenCard: (card: Card) => void
}

export function KanbanBoard({ columns: pageColumns, filter, sort, save, onOpenCard }: KanbanBoardProps) {
  const queryClient = useQueryClient()
  // While dragging, the board renders this copy, so a card can visibly change
  // columns before anything is saved.
  const [draft, setDraft] = useState<Column[] | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] },
    }),
  )

  // Read from the cache, because the page hears about a drop only after a tick.
  // Until then the board would put the card back, and the drop animation would
  // aim at the old place while the card appears at the new one.
  const savedColumns = queryClient.getQueryData<Board>(BOARD_QUERY_KEY)?.columns ?? pageColumns
  const columns = draft ?? savedColumns
  // Order is saved by position in the whole column, so dragging a filtered,
  // partial list could not place a card correctly.
  const filtering = isFiltering(filter)
  // A drag works on arranged cards and leaves them as they are, so that a card
  // does not jump to its category on the way.
  const { shows, orderOf, arrange } = useTaskCategories(savedColumns, sort)
  const visibleColumns = useMemo(
    () => filterColumns(draft ?? arrange(savedColumns), filter),
    [draft, savedColumns, arrange, filter],
  )
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
    setDraft(arrange(savedColumns))
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
      return finishDrag(arrayMove(savedColumns, from, to), () => api.moveColumn(id, to))
    }

    const target = findCardColumn(draft, id)
    const original = findCardColumn(savedColumns, id)
    if (!target || !original) return finishDrag(null)
    const overIndex = cardIndex(target, overId)
    const dropIndex = overIndex >= 0 ? overIndex : cardIndex(target, id)
    const dropped = placeCard(draft, id, target.id, dropIndex).find((column) => column.id === target.id)
    const savedTarget = savedColumns.find((column) => column.id === target.id)
    if (!dropped || !savedTarget) return finishDrag(null)
    // A sorted column decides the place itself, so a card dropped elsewhere goes back to it.
    const order = orderOf(target.id)
    const index = order ? savedIndex(savedTarget.cards, dropped.cards.toSorted(order), id, order) : dropIndex
    if (target.id === original.id && index === cardIndex(original, id)) return finishDrag(null)
    finishDrag(placeCard(savedColumns, id, target.id, index), () => api.moveCard(id, target.id, index))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={detectCollisions}
      measuring={MEASURING}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => finishDrag(null)}
    >
      <div className="flex min-h-0 flex-1 items-start gap-3 overflow-x-auto scroll-pl-4 p-4 max-md:snap-x max-md:snap-proximity">
        <SortableContext items={visibleColumns.map((column) => column.id)} strategy={horizontalListSortingStrategy}>
          {visibleColumns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              totalCards={columns.find(({ id }) => id === column.id)?.cards.length ?? 0}
              grouped={shows(column.id) && sort !== 'urgency'}
              showCategory={shows(column.id) && sort === 'urgency'}
              activeId={activeId}
              dragDisabled={filtering}
              onAddCard={(title) => save(() => api.createCard(column.id, title))}
              onOpenCard={onOpenCard}
              onRename={(title) => save(() => api.updateColumn(column.id, { title }))}
              onColorChange={(color) => save(() => api.updateColumn(column.id, { color }))}
              onDelete={() => save(() => api.deleteColumn(column.id))}
            />
          ))}
        </SortableContext>
        <div className="w-72 shrink-0">
          <InlineAdd
            label={t('tasks.addColumn')}
            placeholder={t('tasks.columnName')}
            onSubmit={(title) => save(() => api.createColumn(title))}
          />
        </div>
      </div>

      <DragOverlay>
        {activeCard && (
          <div className={cn(cardClass(activeCard.color), 'cursor-grabbing shadow-lg')}>
            <CardContent card={activeCard} />
          </div>
        )}
        {activeColumn && (
          <div className="flex max-h-[80svh] w-72 cursor-grabbing flex-col gap-2 overflow-hidden rounded-lg bg-muted p-2 shadow-lg">
            <p className="flex h-8 items-center truncate pl-1 text-sm font-medium">{activeColumn.title}</p>
            {activeColumn.cards.map((card) => (
              <div key={card.id} className={cardClass(card.color)}>
                <CardContent card={card} />
              </div>
            ))}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
