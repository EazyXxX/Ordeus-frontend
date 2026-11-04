import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'

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
import type { Folder, Note, NoteInput, NoteRef } from './api'

const parseTags = (value: string) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

type NoteDialogProps = {
  note: Note | null
  folders: Folder[]
  allNotes: Note[]
  onClose: () => void
  onSave: (input: NoteInput) => void
  onDelete: () => void
}

export function NoteDialog({ note, folders, allNotes, onClose, onSave, onDelete }: NoteDialogProps) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [body, setBody] = useState(note?.body ?? '')
  const [folder, setFolder] = useState(note?.folder ?? '')
  const [tags, setTags] = useState(note?.tags.join(', ') ?? '')
  const [links, setLinks] = useState<NoteRef[]>(note?.links ?? [])
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const linkOptions = allNotes.filter(
    (other) => other.id !== note?.id && !links.some((link) => link.id === other.id),
  )

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return
    onSave({ title, body, folder, tags: parseTags(tags), linkIds: links.map((link) => link.id) })
    onClose()
  }

  function addLink(id: string) {
    const other = allNotes.find((candidate) => candidate.id === id)
    if (other) setLinks([...links, { id: other.id, title: other.title }])
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={submit} className="flex flex-col gap-3">
          <DialogHeader>
            <DialogTitle>{note ? 'Запись' : 'Новая запись'}</DialogTitle>
            <DialogDescription className="sr-only">Текст, папка, теги и связи записи</DialogDescription>
          </DialogHeader>

          <Input
            aria-label="Заголовок"
            placeholder="Заголовок"
            maxLength={200}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <Textarea
            aria-label="Текст"
            placeholder="Текст"
            className="min-h-40"
            maxLength={50_000}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <Input
            aria-label="Папка"
            placeholder="Папка"
            list="diary-folders"
            maxLength={200}
            value={folder}
            onChange={(event) => setFolder(event.target.value)}
          />
          <datalist id="diary-folders">
            {folders.map(({ id, name }) => (
              <option key={id} value={name} />
            ))}
          </datalist>
          <Input
            aria-label="Теги через запятую"
            placeholder="Теги через запятую"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Связанные записи</p>
            {links.map((link) => (
              <div key={link.id} className="flex items-center gap-2 rounded-md bg-muted/60 py-1 pr-1 pl-2.5 text-sm">
                <span className="min-w-0 flex-1 truncate">{link.title}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Убрать связь с записью ${link.title}`}
                  onClick={() => setLinks(links.filter((other) => other.id !== link.id))}
                >
                  <X />
                </Button>
              </div>
            ))}
            <select
              aria-label="Добавить связь"
              className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-muted-foreground"
              value=""
              onChange={(event) => addLink(event.target.value)}
            >
              <option value="">Добавить связь…</option>
              {linkOptions.map((other) => (
                <option key={other.id} value={other.id}>
                  {other.title}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="sm:justify-between">
            {note ? (
              <Button type="button" variant="destructive" onClick={() => setConfirmingDelete(true)}>
                Удалить
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={!title.trim()}>
              Сохранить
            </Button>
          </DialogFooter>
        </form>

        <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
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
