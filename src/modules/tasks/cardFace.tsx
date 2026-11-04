import { AlignLeft, CalendarDays, CheckSquare } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Card } from './api'
import { formatDue, isOverdue, PRIORITY_ICONS, PRIORITY_LABELS } from './appearance'

export function CardContent({ card }: { card: Card }) {
  const done = card.checklist.filter((item) => item.done).length
  const total = card.checklist.length
  const priority = card.priority === 'none' ? null : PRIORITY_ICONS[card.priority]
  const hasMeta = priority || card.dueDate || total > 0 || card.description

  return (
    <>
      <span className="block text-sm break-words">{card.title}</span>
      {hasMeta && (
        <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {priority && (
            <priority.icon
              className={cn('size-3.5', priority.className)}
              role="img"
              aria-label={`Приоритет: ${PRIORITY_LABELS[card.priority]}`}
            />
          )}
          {card.dueDate && (
            <span className={cn('flex items-center gap-1', isOverdue(card.dueDate) && 'font-medium text-destructive')}>
              <CalendarDays className="size-3.5" aria-hidden />
              {formatDue(card.dueDate)}
            </span>
          )}
          {total > 0 && (
            <span className={cn('flex items-center gap-1', done === total && 'text-emerald-600')}>
              <CheckSquare className="size-3.5" aria-hidden />
              {done}/{total}
            </span>
          )}
          {card.description && <AlignLeft className="size-3.5" role="img" aria-label="Есть описание" />}
        </span>
      )}
    </>
  )
}
