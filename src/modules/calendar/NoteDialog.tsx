import { useState, type FormEvent } from 'react'

import { ColorPicker } from '@/components/ColorPicker'
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Color } from '@/lib/colors'
import type { CalendarNote, NoteInput } from './api'

const DEFAULT_COLOR: Color = 'blue'

type NoteDialogProps = {
  note: CalendarNote | null
  date: string
  onClose: () => void
  onSave: (input: NoteInput) => void
  onDelete: () => void
}

export function NoteDialog({ note, date, onClose, onSave, onDelete }: NoteDialogProps) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [body, setBody] = useState(note?.body ?? '')
  const [day, setDay] = useState(note?.date ?? date)
  const [time, setTime] = useState(note?.time ?? '')
  const [color, setColor] = useState<Color>(note?.color ?? DEFAULT_COLOR)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const valid = title.trim() !== '' && day !== ''

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!valid) return
    onSave({ date: day, time: time || null, title, body, color })
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <DialogHeader>
            <DialogTitle>{note ? 'Заметка' : 'Новая заметка'}</DialogTitle>
            <DialogDescription className="sr-only">Название, дата, время и текст заметки</DialogDescription>
          </DialogHeader>

          <Input
            autoFocus
            aria-label="Название"
            placeholder="Название"
            maxLength={200}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" aria-label="Дата" value={day} onChange={(event) => setDay(event.target.value)} />
            <Input type="time" aria-label="Время" value={time} onChange={(event) => setTime(event.target.value)} />
          </div>
          <Textarea
            aria-label="Текст"
            placeholder="Текст"
            className="min-h-24"
            maxLength={10_000}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <ColorPicker value={color} onChange={setColor} />

          <DialogFooter className="sm:justify-between">
            {note ? (
              <Button type="button" variant="destructive" onClick={() => setConfirmingDelete(true)}>
                Удалить
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={!valid}>
              Сохранить
            </Button>
          </DialogFooter>
        </form>

        <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить заметку?</AlertDialogTitle>
              <AlertDialogDescription>Отменить это нельзя.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={onDelete}>
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}
