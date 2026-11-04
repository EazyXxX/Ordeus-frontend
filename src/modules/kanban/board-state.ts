import { arrayMove } from '@dnd-kit/sortable'

import type { Card, Column } from './api'

export function findCardColumn(columns: Column[], cardId: string) {
  return columns.find((column) => column.cards.some((card) => card.id === cardId))
}

export function findCard(columns: Column[], cardId: string) {
  return findCardColumn(columns, cardId)?.cards.find((card) => card.id === cardId)
}

export function cardIndex(column: Column, cardId: string) {
  return column.cards.findIndex((card) => card.id === cardId)
}

// Moves a card to another column, or within its own column.
export function placeCard(columns: Column[], cardId: string, targetId: string, index: number): Column[] {
  const source = findCardColumn(columns, cardId)
  const card = findCard(columns, cardId)
  if (!source || !card) return columns

  if (source.id === targetId) {
    const cards = arrayMove(source.cards, cardIndex(source, cardId), index)
    return columns.map((column) => (column.id === targetId ? { ...column, cards } : column))
  }

  const moved: Card = { ...card, columnId: targetId }
  return columns.map((column) => {
    if (column.id === source.id) {
      return { ...column, cards: column.cards.filter((other) => other.id !== cardId) }
    }
    if (column.id === targetId) {
      return { ...column, cards: column.cards.toSpliced(index, 0, moved) }
    }
    return column
  })
}
