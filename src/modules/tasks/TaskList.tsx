import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, CalendarDays } from 'lucide-react'

import { locale, t } from '@/i18n'
import { COLOR_DOT } from '@/lib/colors'
import { cn } from '@/lib/utils'
import type { Card, Column } from './api'
import { compareCategories, compareUrgency, type CardSort } from './categories'
import { COLOR_EDGE, formatDue, isOverdue, PRIORITY_ICONS, PRIORITY_LABELS } from './appearance'
import { InlineAdd } from './InlineAdd'

type SortKey = 'title' | 'status' | 'category' | 'priority' | 'due'
type Sort = { key: SortKey; direction: 1 | -1 }
type Row = { card: Card; column: Column; category: string; order: number }

const collator = new Intl.Collator(locale)

const COMPARE: Record<Exclude<SortKey, 'due'>, (a: Row, b: Row) => number> = {
  title: (a, b) => collator.compare(a.card.title, b.card.title),
  status: (a, b) => a.order - b.order,
  category: (a, b) => compareCategories(a.category, b.category) || compareUrgency(a.card, b.card),
  priority: (a, b) => compareUrgency(b.card, a.card),
}

const SORT_OF: Record<CardSort, Sort> = {
  manual: { key: 'status', direction: 1 },
  urgency: { key: 'priority', direction: -1 },
  category: { key: 'category', direction: 1 },
}

function sortRows(rows: Row[], { key, direction }: Sort) {
  return rows.toSorted((a, b) => {
    if (key !== 'due') return direction * COMPARE[key](a, b) || a.order - b.order
    // Tasks without a due date stay last in both directions.
    if (a.card.dueDate === b.card.dueDate) return a.order - b.order
    if (a.card.dueDate === null) return 1
    if (b.card.dueDate === null) return -1
    return direction * a.card.dueDate.localeCompare(b.card.dueDate)
  })
}

type SortHeaderProps = {
  sortKey: SortKey
  label: string
  sort: Sort
  className?: string
  onSort: (key: SortKey) => void
}

function SortHeader({ sortKey, label, sort, className, onSort }: SortHeaderProps) {
  const active = sort.key === sortKey
  const Arrow = sort.direction === 1 ? ArrowUp : ArrowDown

  return (
    <th
      scope="col"
      aria-sort={active ? (sort.direction === 1 ? 'ascending' : 'descending') : 'none'}
      className={cn('px-3 py-2 text-left font-medium', className)}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        {label}
        {active && <Arrow className="size-3" aria-hidden />}
      </button>
    </th>
  )
}

type TaskListProps = {
  columns: Column[]
  // Where the list starts. Its column headers sort it further.
  cardSort: CardSort
  // Whether the list has a category column at all.
  categories: boolean
  showsCategory: (columnId: string) => boolean
  onAddCard: (columnId: string, title: string) => void
  onOpenCard: (card: Card) => void
}

export function TaskList({ columns, cardSort, categories, showsCategory, onAddCard, onOpenCard }: TaskListProps) {
  const [sort, setSort] = useState<Sort>(SORT_OF[cardSort])

  const rows = useMemo(() => {
    const all = columns.flatMap((column) =>
      column.cards.map((card) => ({ card, column, category: showsCategory(column.id) ? card.category : '' })),
    )
    return sortRows(all.map((row, order) => ({ ...row, order })), sort)
  }, [columns, showsCategory, sort])

  function changeSort(key: SortKey) {
    setSort((current) => ({ key, direction: current.key === key ? (current.direction === 1 ? -1 : 1) : 1 }))
  }

  const firstColumn = columns[0]

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('tasks.none')}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full table-fixed text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <SortHeader sortKey="title" label={t('tasks.task')} sort={sort} onSort={changeSort} />
                <SortHeader sortKey="status" label={t('tasks.status')} sort={sort} className="hidden w-32 sm:table-cell md:w-44" onSort={changeSort} />
                {categories && (
                  <SortHeader
                    sortKey="category"
                    label={t('tasks.category')}
                    sort={sort}
                    className="hidden w-36 lg:table-cell"
                    onSort={changeSort}
                  />
                )}
                <SortHeader
                  sortKey="priority"
                  label={t('common.priority')}
                  sort={sort}
                  className="hidden w-36 md:table-cell"
                  onSort={changeSort}
                />
                <SortHeader sortKey="due" label={t('common.due')} sort={sort} className="hidden w-28 sm:table-cell" onSort={changeSort} />
                <th scope="col" className="hidden w-24 px-3 py-2 text-left font-medium lg:table-cell">
                  {t('tasks.checklist')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ card, column, category }) => {
                const priority = card.priority === 'none' ? null : PRIORITY_ICONS[card.priority]
                const done = card.checklist.filter((item) => item.done).length

                return (
                  <tr key={card.id} className="border-b last:border-b-0 hover:bg-muted/40">
                    <td className={cn('border-l-4 px-3 py-2', COLOR_EDGE[card.color])}>
                      <button
                        type="button"
                        onClick={() => onOpenCard(card)}
                        className="block w-full rounded-sm text-left break-words outline-none focus-visible:ring-2 focus-visible:ring-ring sm:truncate"
                      >
                        {card.title}
                      </button>
                      {category && <span className="hidden truncate text-xs text-muted-foreground sm:block lg:hidden">{category}</span>}
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:hidden">
                        <span className="flex items-center gap-1.5">
                          <span className={cn('size-2 shrink-0 rounded-full', COLOR_DOT[column.color])} aria-hidden />
                          {column.title}
                        </span>
                        {category && <span>{category}</span>}
                        {priority && (
                          <span className="flex items-center gap-1">
                            <priority.icon className={cn('size-3.5', priority.className)} aria-hidden />
                            {PRIORITY_LABELS[card.priority]}
                          </span>
                        )}
                        {card.dueDate && (
                          <span
                            className={cn(
                              'flex items-center gap-1',
                              isOverdue(card.dueDate) && 'font-medium text-destructive',
                            )}
                          >
                            <CalendarDays className="size-3.5" aria-hidden />
                            {formatDue(card.dueDate)}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="hidden px-3 py-2 sm:table-cell">
                      <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                        <span className={cn('size-2 shrink-0 rounded-full', COLOR_DOT[column.color])} aria-hidden />
                        <span className="truncate">{column.title}</span>
                      </span>
                    </td>
                    {categories && (
                      <td className="hidden truncate px-3 py-2 text-xs text-muted-foreground lg:table-cell">
                        {category || '—'}
                      </td>
                    )}
                    <td className="hidden px-3 py-2 md:table-cell">
                      {priority ? (
                        <span className="flex items-center gap-1.5 text-xs">
                          <priority.icon className={cn('size-3.5', priority.className)} aria-hidden />
                          {PRIORITY_LABELS[card.priority]}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="hidden px-3 py-2 sm:table-cell">
                      {card.dueDate ? (
                        <span
                          className={cn(
                            'flex items-center gap-1 text-xs',
                            isOverdue(card.dueDate) ? 'font-medium text-destructive' : 'text-muted-foreground',
                          )}
                        >
                          <CalendarDays className="size-3.5" aria-hidden />
                          {formatDue(card.dueDate)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="hidden px-3 py-2 text-xs text-muted-foreground lg:table-cell">
                      {card.checklist.length > 0 ? `${done}/${card.checklist.length}` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {firstColumn && (
        <div className="max-w-sm">
          <InlineAdd
            label={t('tasks.addTo', { name: firstColumn.title })}
            placeholder={t('tasks.taskName')}
            onSubmit={(title) => onAddCard(firstColumn.id, title)}
          />
        </div>
      )}
    </div>
  )
}
