import { useState, type ReactNode } from 'react'
import { Trash2 } from 'lucide-react'

import { locale, t } from '@/i18n'
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
import { ColorPicker } from '@/components/ColorPicker'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { hasTouchScreen } from '@/lib/utils'
import type { Card, CardInput, Column } from './api'
import { PRIORITIES, PRIORITY_LABELS, type Priority } from './appearance'
import { compareCategories } from './categories'
import { Checklist, type ChecklistRow } from './Checklist'

const dateTimeFormat = new Intl.DateTimeFormat(locale, {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})

const selectClass = 'h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
      {label}
      {children}
    </label>
  )
}

type CardDialogProps = {
  card: Card
  columns: Column[]
  onClose: () => void
  onSave: (input: CardInput, columnId: string) => void
  onDelete: () => void
}

export function CardDialog({ card, columns, onClose, onSave, onDelete }: CardDialogProps) {
  const knownCategories = [
    ...new Set(columns.flatMap((column) => column.cards.map((other) => other.category)).filter(Boolean)),
  ].sort(compareCategories)
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description)
  const [category, setCategory] = useState(card.category)
  const [color, setColor] = useState(card.color)
  const [priority, setPriority] = useState<Priority>(card.priority)
  const [dueDate, setDueDate] = useState(card.dueDate ?? '')
  const [columnId, setColumnId] = useState(card.columnId)
  const [checklist, setChecklist] = useState<ChecklistRow[]>(() =>
    card.checklist.map((item, key) => ({ ...item, key })),
  )
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  // Closing saves: a ticked checklist item must never vanish silently. An
  // emptied title keeps the old one, because a card cannot exist without it.
  function close() {
    const input: CardInput = {
      title: title.trim() || card.title,
      description,
      category: category.trim(),
      color,
      priority,
      dueDate: dueDate || null,
      checklist: checklist.map(({ title: itemTitle, done }) => ({ title: itemTitle, done })),
    }
    const original: CardInput = {
      title: card.title,
      description: card.description,
      category: card.category,
      color: card.color,
      priority: card.priority,
      dueDate: card.dueDate,
      checklist: card.checklist,
    }
    if (columnId !== card.columnId || JSON.stringify(input) !== JSON.stringify(original)) {
      onSave(input, columnId)
    }
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent
        className="max-h-[90svh] overflow-y-auto sm:max-w-3xl max-sm:h-dvh max-sm:max-h-dvh max-sm:max-w-full max-sm:rounded-none"
        onOpenAutoFocus={(event) => hasTouchScreen() && event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="sr-only">{t('tasks.card')}</DialogTitle>
          <DialogDescription className="sr-only">{t('tasks.cardHint')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_13rem]">
          <div className="flex min-w-0 flex-col gap-4">
            <Input
              aria-label={t('common.title')}
              className="h-10 text-base font-medium"
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <Textarea
              aria-label={t('tasks.description')}
              placeholder={t('tasks.description')}
              className="min-h-32"
              maxLength={10_000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <Checklist items={checklist} onChange={setChecklist} />
          </div>

          <aside className="flex flex-col gap-3">
            <Field label={t('tasks.column')}>
              <select className={selectClass} value={columnId} onChange={(event) => setColumnId(event.target.value)}>
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('tasks.category')}>
              <Input
                className="h-8"
                list="task-categories"
                maxLength={50}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              />
              <datalist id="task-categories">
                {knownCategories.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </Field>
            <Field label={t('common.priority')}>
              <select
                className={selectClass}
                value={priority}
                onChange={(event) => setPriority(event.target.value as Priority)}
              >
                {PRIORITIES.map((value) => (
                  <option key={value} value={value}>
                    {PRIORITY_LABELS[value]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('common.due')}>
              <Input
                type="date"
                className="h-8"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </Field>
            <ColorPicker value={color} onChange={setColor} />

            <dl className="mt-1 flex flex-col gap-1 text-xs text-muted-foreground">
              <div>
                <dt className="inline">{t('tasks.created')}</dt>
                <dd className="inline">{dateTimeFormat.format(new Date(card.createdAt))}</dd>
              </div>
              <div>
                <dt className="inline">{t('tasks.updated')}</dt>
                <dd className="inline">{dateTimeFormat.format(new Date(card.updatedAt))}</dd>
              </div>
            </dl>

            <div className="mt-auto flex flex-col gap-2 pt-2">
              <Button type="button" onClick={close}>
                {t('common.done')}
              </Button>
              <Button type="button" variant="ghost" className="text-destructive" onClick={() => setConfirmingDelete(true)}>
                <Trash2 />
                {t('common.delete')}
              </Button>
            </div>
          </aside>
        </div>

        <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('tasks.deleteCard')}</AlertDialogTitle>
              <AlertDialogDescription>{t('common.cannotUndo')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={onDelete}>
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}
