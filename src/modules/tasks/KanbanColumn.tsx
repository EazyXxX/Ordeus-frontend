import { useState } from 'react'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MoreHorizontal } from 'lucide-react'

import { t } from '@/i18n'
import { ColorSubmenu } from '@/components/ColorSubmenu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { COLOR_DOT, type Color } from '@/lib/colors'
import { cn } from '@/lib/utils'
import type { Card, Column } from './api'
import { InlineAdd } from './InlineAdd'
import { KanbanCard } from './KanbanCard'

type KanbanColumnProps = {
  column: Column
  // The whole column, even when a board filter hides some of its cards.
  totalCards: number
  dragDisabled: boolean
  onAddCard: (title: string) => void
  onOpenCard: (card: Card) => void
  onRename: (title: string) => void
  onColorChange: (color: Color) => void
  onDelete: () => void
}

export function KanbanColumn({
  column,
  totalCards,
  dragDisabled,
  onAddCard,
  onOpenCard,
  onRename,
  onColorChange,
  onDelete,
}: KanbanColumnProps) {
  const [renaming, setRenaming] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'column' },
    disabled: dragDisabled,
  })

  function finishRename(value: string) {
    setRenaming(false)
    const title = value.trim()
    if (title && title !== column.title) onRename(title)
  }

  function requestDelete() {
    if (totalCards > 0) setConfirmingDelete(true)
    else onDelete()
  }

  return (
    <section
      ref={setNodeRef}
      aria-label={column.title}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'flex max-h-full w-72 shrink-0 snap-start flex-col gap-2 rounded-lg bg-muted/60 p-2',
        isDragging && 'opacity-40',
      )}
    >
      <header className="flex h-8 items-center gap-1.5 pl-1">
        <span className={cn('size-2.5 shrink-0 rounded-full', COLOR_DOT[column.color])} aria-hidden />
        {renaming ? (
          <Input
            autoFocus
            aria-label={t('tasks.columnName')}
            className="h-7"
            maxLength={200}
            defaultValue={column.title}
            onFocus={(event) => event.target.select()}
            onBlur={(event) => finishRename(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
              if (event.key === 'Escape') setRenaming(false)
            }}
          />
        ) : (
          <>
            <button
              ref={setActivatorNodeRef}
              type="button"
              className="min-w-0 cursor-grab touch-manipulation truncate rounded-sm text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              {column.title}
            </button>
            <span className="text-xs text-muted-foreground">{column.cards.length}</span>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="ml-auto" aria-label={t('tasks.columnActions', { name: column.title })}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onCloseAutoFocus={(event) => event.preventDefault()}>
                <DropdownMenuItem onSelect={() => setRenaming(true)}>{t('common.rename')}</DropdownMenuItem>
                <ColorSubmenu value={column.color} onChange={onColorChange} />
                <DropdownMenuItem variant="destructive" onSelect={requestDelete}>
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </header>

      <SortableContext items={column.cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-1 flex-col gap-2 overflow-y-auto">
          {column.cards.map((card) => (
            <KanbanCard key={card.id} card={card} dragDisabled={dragDisabled} onOpen={() => onOpenCard(card)} />
          ))}
        </div>
      </SortableContext>

      <InlineAdd label={t('tasks.addCard')} placeholder={t('tasks.cardName')} onSubmit={onAddCard} />

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tasks.deleteColumn', { name: column.title })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tasks.deleteColumnText', { count: totalCards })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onDelete}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
