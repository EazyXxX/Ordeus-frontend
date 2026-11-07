import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { cn } from '@/lib/utils'
import type { Card } from './api'
import { cardClass } from './appearance'
import { CardContent } from './cardFace'

type KanbanCardProps = {
  card: Card
  showCategory: boolean
  dragDisabled: boolean
  onOpen: () => void
}

export function KanbanCard({ card, showCategory, dragDisabled, onOpen }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card' },
    disabled: dragDisabled,
    // The default skips cards that change columns, which makes neighbours jump.
    animateLayoutChanges: ({ isSorting, wasDragging }) => isSorting || wasDragging,
  })

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        cardClass(card.color),
        'w-full touch-manipulation text-left shadow-xs outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring',
        dragDisabled ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
      {...attributes}
      {...listeners}
      onClick={onOpen}
    >
      <CardContent card={card} showCategory={showCategory} />
    </button>
  )
}
