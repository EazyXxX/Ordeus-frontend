import { useCallback } from 'react'

import { useCurrentUser } from '@/app/account/session'
import { locale } from '@/i18n'
import type { Card, Column } from './api'
import { PRIORITIES } from './appearance'

const collator = new Intl.Collator(locale)

export const CARD_SORTS = ['manual', 'urgency', 'category'] as const
export type CardSort = (typeof CARD_SORTS)[number]

type CardOrder = (a: Card, b: Card) => number

// The highest priority first, then the nearest due date. No date goes last.
export function compareUrgency(a: Card, b: Card) {
  const priority = PRIORITIES.indexOf(b.priority) - PRIORITIES.indexOf(a.priority)
  if (priority !== 0 || a.dueDate === b.dueDate) return priority
  if (a.dueDate === null) return 1
  if (b.dueDate === null) return -1
  return a.dueDate.localeCompare(b.dueDate)
}

// An empty category goes last.
export function compareCategories(a: string, b: string) {
  if (!a || !b) return Number(!a) - Number(!b)
  return collator.compare(a, b)
}

const byCategory: CardOrder = (a, b) => compareCategories(a.category, b.category)
const byCategoryAndUrgency: CardOrder = (a, b) => byCategory(a, b) || compareUrgency(a, b)

// The board shows cards in some order, but saves it for the whole column. Only
// the order among equal cards shows, so the card goes next to an equal neighbour
// from `arranged`, wherever that one is in the saved order.
export function savedIndex(saved: Card[], arranged: Card[], cardId: string, order: CardOrder) {
  const position = arranged.findIndex((card) => card.id === cardId)
  const card = arranged[position]
  const others = saved.filter((other) => other.id !== cardId)
  const before = arranged[position - 1]
  const after = arranged[position + 1]
  if (before && order(before, card) === 0) return others.findIndex((other) => other.id === before.id) + 1
  if (after && order(after, card) === 0) return others.findIndex((other) => other.id === after.id)
  const current = saved.findIndex((other) => other.id === cardId)
  return current >= 0 ? current : others.length
}

type CardRow = { card: Card; heading?: string }

// Cards with a heading above each category. The dragged card has none and does
// not split its neighbours, because it is only passing through. Without an
// activeId the column is not grouped, so it gets no headings.
export function withHeadings(cards: Card[], activeId: string | null | undefined): CardRow[] {
  if (activeId === undefined || !cards.some((card) => card.category)) return cards.map((card) => ({ card }))
  let previous: string | undefined
  return cards.map((card) => {
    if (card.id === activeId || card.category === previous) return { card }
    previous = card.category
    return { card, heading: card.category }
  })
}

export function useTaskCategories(columns: Column[], sort: CardSort = 'manual') {
  const { taskCategories, backlogColumnId } = useCurrentUser()
  // Going by id survives a renamed column. Without one, or after it was deleted,
  // the first column stands in, which is where a backlog usually is.
  const backlogId = (columns.find((column) => column.id === backlogColumnId) ?? columns[0])?.id

  const shows = useCallback(
    (columnId: string) => taskCategories === 'all' || (taskCategories === 'backlog' && columnId === backlogId),
    [taskCategories, backlogId],
  )
  // Urgency ignores categories on purpose, or an urgent task could sit below
  // whole categories of unimportant ones. Null keeps the author's own order.
  const orderOf = useCallback(
    (columnId: string): CardOrder | null => {
      if (sort === 'urgency') return compareUrgency
      if (!shows(columnId)) return null
      return sort === 'category' ? byCategoryAndUrgency : byCategory
    },
    [sort, shows],
  )
  const arrange = useCallback(
    (list: Column[]) =>
      list.map((column) => {
        const order = orderOf(column.id)
        return order ? { ...column, cards: column.cards.toSorted(order) } : column
      }),
    [orderOf],
  )
  return { enabled: taskCategories !== 'off', shows, orderOf, arrange }
}
